from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.emailer import send_email
from app.models import ApplicationStatus, EmailVerificationChallenge, Role, SellerApplication, User, VerificationStatus
from app.schemas import EmailVerificationConfirm, EmailVerificationRequest, LoginInput, SellerApplicationCreate
from app.security import create_access_token, hash_password, verify_password
from app.settings import get_settings


def _hash_code(code: str) -> str:
    settings = get_settings()
    return hashlib.sha256(f"{settings.secret_key}:{code}".encode("utf-8")).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _generate_temp_password() -> str:
    return secrets.token_urlsafe(10)


def _make_referral_code(name: str) -> str:
    prefix = "".join(ch for ch in name.upper() if ch.isalnum())[:6] or "USER"
    return f"{prefix}{secrets.token_hex(2).upper()}"


def _utc_now() -> datetime:
    return datetime.now(tz=UTC)


def _coerce_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


async def request_email_verification(db: AsyncSession, payload: EmailVerificationRequest) -> EmailVerificationChallenge:
    email = payload.email.lower().strip()
    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    code = _generate_code()
    password_hash = hash_password(payload.password)
    challenge = await db.scalar(select(EmailVerificationChallenge).where(EmailVerificationChallenge.email == email))
    if challenge:
        challenge.name = payload.name.strip()
        challenge.password_hash = password_hash
        challenge.referral_code = payload.referral_code.strip() if payload.referral_code else None
        challenge.verification_code_hash = _hash_code(code)
        challenge.expires_at = _utc_now() + timedelta(minutes=get_settings().verification_code_ttl_minutes)
        challenge.attempts = 0
        challenge.verified_at = None
        challenge.status = VerificationStatus.pending.value
    else:
        challenge = EmailVerificationChallenge(
            email=email,
            name=payload.name.strip(),
            password_hash=password_hash,
            referral_code=payload.referral_code.strip() if payload.referral_code else None,
            verification_code_hash=_hash_code(code),
            expires_at=_utc_now() + timedelta(minutes=get_settings().verification_code_ttl_minutes),
            attempts=0,
            status=VerificationStatus.pending.value,
        )
        db.add(challenge)

    await db.flush()
    send_email(
        email,
        "SIDRAT verification code",
        f"Your SIDRAT verification code is: {code}\n\nIt expires in {get_settings().verification_code_ttl_minutes} minutes.",
    )
    return challenge


async def confirm_email_verification(db: AsyncSession, payload: EmailVerificationConfirm) -> tuple[User, str]:
    email = payload.email.lower().strip()
    challenge = await db.scalar(select(EmailVerificationChallenge).where(EmailVerificationChallenge.email == email))
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification code not found")
    if challenge.status != VerificationStatus.pending.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Verification already processed")
    if _coerce_utc(challenge.expires_at) < _utc_now():
        challenge.status = VerificationStatus.expired.value
        await db.flush()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Verification code expired")
    if challenge.verification_code_hash != _hash_code(payload.code):
        challenge.attempts += 1
        await db.flush()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user = User(
        email=email,
        name=challenge.name,
        role=Role.buyer.value,
        password_hash=challenge.password_hash,
        email_verified_at=_utc_now(),
        referral_code=challenge.referral_code or _make_referral_code(challenge.name),
        wallet_balance=0,
        full_name=challenge.name,
    )
    db.add(user)
    challenge.verified_at = _utc_now()
    challenge.status = VerificationStatus.verified.value
    await db.flush()
    await db.refresh(user)
    token = create_access_token(str(user.id))
    return user, token


async def login_user(db: AsyncSession, payload: LoginInput) -> tuple[User, str]:
    email = payload.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")
    if not user.email_verified_at:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return user, token


async def submit_seller_application(db: AsyncSession, payload: SellerApplicationCreate) -> SellerApplication:
    application = SellerApplication(
        email=payload.email.lower().strip(),
        name=payload.name.strip(),
        company_name=payload.company_name.strip() if payload.company_name else None,
        phone=payload.phone.strip() if payload.phone else None,
        message=payload.message.strip() if payload.message else None,
        status=ApplicationStatus.pending.value,
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


async def approve_seller_application(db: AsyncSession, application_id: uuid.UUID, admin: User) -> tuple[SellerApplication, User]:
    application = await db.scalar(select(SellerApplication).where(SellerApplication.id == application_id))
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller application not found")
    if application.status != ApplicationStatus.pending.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seller application already processed")

    user = await db.scalar(select(User).where(User.email == application.email))
    temp_password = None
    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")
        user.role = Role.seller.value
        if not user.email_verified_at:
            user.email_verified_at = datetime.now(tz=UTC)
    else:
        temp_password = _generate_temp_password()
        user = User(
            email=application.email,
            name=application.name,
            role=Role.seller.value,
            password_hash=hash_password(temp_password),
            email_verified_at=_utc_now(),
            referral_code=_make_referral_code(application.name),
            wallet_balance=0,
            full_name=application.name,
            phone=application.phone,
        )
        db.add(user)

    application.status = ApplicationStatus.approved.value
    application.approved_user_id = user.id
    application.decided_at = datetime.now(tz=UTC)
    application.decided_by = admin.id
    await db.flush()
    await db.refresh(application)

    if temp_password:
        send_email(
            application.email,
            "SIDRAT seller access approved",
            f"Your seller access is approved.\n\nTemporary password: {temp_password}\nEmail: {application.email}\n\nPlease log in and update your credentials as soon as possible.",
        )

    return application, user


async def reject_seller_application(db: AsyncSession, application_id: uuid.UUID, admin: User, notes: str | None = None) -> SellerApplication:
    application = await db.scalar(select(SellerApplication).where(SellerApplication.id == application_id))
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller application not found")
    if application.status != ApplicationStatus.pending.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seller application already processed")
    application.status = ApplicationStatus.rejected.value
    application.decided_at = datetime.now(tz=UTC)
    application.decided_by = admin.id
    if notes:
        application.message = f"{application.message or ''}\n\nAdmin notes: {notes}".strip()
    await db.flush()
    await db.refresh(application)
    return application
