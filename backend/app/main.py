from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from uuid import UUID

import structlog
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cache import Cache
from app.admin_cms import router as cms_router, seed_cms_defaults
from app.auth_service import (
    approve_seller_application,
    confirm_email_verification,
    login_user,
    reject_seller_application,
    request_email_verification,
    submit_seller_application,
)
from app.emailer import EmailDeliveryError
from app.db import SessionLocal, get_read_session, get_session, init_db, ping_db
from app.dependencies import admin_user, current_user, get_cache, get_redis, seller_user, verified_user
from app.models import Cart, Order, Product, Session, SellerApplication, User, WalletTransaction, WithdrawalRequest
from app.settings import get_settings
from app.schemas import (
    AuthSessionRead,
    CartItemPatch,
    CartItemRead,
    CartItemUpsert,
    CartRead,
    CreateSessionInput,
    EmailVerificationConfirm,
    EmailVerificationRequest,
    JoinSessionInput,
    LoginInput,
    ParticipationRead,
    OrderConfirmInput,
    OrderRead,
    ProductRead,
    SellerApplicationCreate,
    SellerApplicationDecision,
    SellerApplicationRead,
    SessionRead,
    UserRead,
    WalletTransactionRead,
    WithdrawalRequestRead,
)
from app.seed import seed_demo_data
from app.services import (
    create_cart_order,
    create_session,
    create_withdrawal,
    delete_cart_item,
    get_family_sessions,
    get_or_create_cart,
    get_product_by_slug,
    get_seller_dashboard,
    get_session_by_id,
    confirm_order,
    join_session_by_id,
    list_catalog,
    list_cart,
    patch_cart_item,
    upsert_cart_item,
)

logger = structlog.get_logger(__name__)


def setup_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ]
    )


def product_read(product: Product) -> ProductRead:
    return ProductRead.model_validate(product)


def session_read(gb_session: Session) -> SessionRead:
    return SessionRead.model_validate(gb_session)


def cart_read(cart: Cart) -> CartRead:
    return CartRead.model_validate(cart)


def order_read(order: Order) -> OrderRead:
    return OrderRead.model_validate(order)


def user_read(user: User) -> UserRead:
    return UserRead.model_validate(user)


def items_payload(cart: Cart) -> CartRead:
    return cart_read(cart)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    if settings.bootstrap_database:
        await init_db()
    if settings.seed_demo_data:
        async with SessionLocal() as db:
            await seed_demo_data(db)
            await seed_cms_defaults(db)
    redis = None
    try:
        redis = Redis.from_url(settings.redis_url, decode_responses=True)
        await redis.ping()
        app.state.redis = redis
    except Exception:  # pragma: no cover - redis is optional in dev
        if redis is not None:
            await redis.aclose()
        app.state.redis = None
    yield
    redis = getattr(app.state, "redis", None)
    if redis:
        await redis.aclose()


app = FastAPI(
    title="Sidrat API",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)
app.include_router(cms_router)

settings = get_settings()
settings_origins = settings.cors_origins or ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id") or f"req-{int(time.time() * 1000)}"
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response


@app.get("/healthz")
async def healthz():
    return {"ok": True}


@app.get("/readyz")
async def readyz(db: AsyncSession = Depends(get_session), redis: Redis | None = Depends(get_redis)):
    db_ready = False
    try:
        db_ready = await ping_db(db)
    except Exception:
        db_ready = False
    if not db_ready:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    redis_ready: bool | None = None
    if redis is not None:
        try:
            redis_ready = await redis.ping()
        except Exception:
            redis_ready = False
        if redis_ready is False:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Redis not ready")

    return {"ok": True, "db": db_ready, "redis": redis_ready}


@app.post("/api/v1/auth/register/request-code")
async def request_registration_code(payload: EmailVerificationRequest, db: AsyncSession = Depends(get_session)):
    challenge = await request_email_verification(db, payload)
    await db.commit()
    return {"ok": True, "email": challenge.email, "expiresAt": challenge.expires_at}


@app.post("/api/v1/auth/register/verify", response_model=AuthSessionRead)
async def verify_registration_code(payload: EmailVerificationConfirm, db: AsyncSession = Depends(get_session)):
    user, token = await confirm_email_verification(db, payload)
    await db.commit()
    return AuthSessionRead(access_token=token, user=user_read(user))


@app.post("/api/v1/auth/login", response_model=AuthSessionRead)
async def login(payload: LoginInput, db: AsyncSession = Depends(get_session)):
    user, token = await login_user(db, payload)
    await db.commit()
    return AuthSessionRead(access_token=token, user=user_read(user))


@app.post("/api/v1/seller-applications", response_model=SellerApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_seller_application(payload: SellerApplicationCreate, db: AsyncSession = Depends(get_session)):
    application = await submit_seller_application(db, payload)
    await db.commit()
    return SellerApplicationRead.model_validate(application)


@app.get("/api/v1/admin/seller-applications", response_model=list[SellerApplicationRead])
async def list_seller_applications(user: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(SellerApplication).order_by(SellerApplication.created_at.desc()))
    return [SellerApplicationRead.model_validate(item) for item in rows.all()]


@app.post("/api/v1/admin/seller-applications/{application_id}/approve", response_model=SellerApplicationRead)
async def approve_seller_application_endpoint(
    application_id: UUID,
    user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    application, _ = await approve_seller_application(db, application_id, user)
    await db.commit()
    return SellerApplicationRead.model_validate(application)


@app.post("/api/v1/admin/seller-applications/{application_id}/reject", response_model=SellerApplicationRead)
async def reject_seller_application_endpoint(
    application_id: UUID,
    payload: SellerApplicationDecision,
    user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    application = await reject_seller_application(db, application_id, user, notes=payload.notes)
    await db.commit()
    return SellerApplicationRead.model_validate(application)


@app.get("/api/v1/me", response_model=UserRead)
async def me(user: User = Depends(current_user)):
    return user_read(user)


@app.get("/api/v1/catalog", response_model=list[ProductRead])
async def catalog(
    category: str | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_read_session),
    cache: Cache = Depends(get_cache),
):
    key = f"catalog:{category or 'all'}:{q or ''}:{limit}:{offset}"
    cached = await cache.get_json(key)
    if cached is not None:
        return cached
    products = await list_catalog(db, category=category, q=q, limit=limit, offset=offset)
    payload = [product_read(product).model_dump(by_alias=True) for product in products]
    await cache.set_json(key, payload, ttl_seconds=30)
    return payload


@app.get("/api/v1/products/{slug}", response_model=ProductRead)
async def product_detail(
    slug: str,
    db: AsyncSession = Depends(get_read_session),
    cache: Cache = Depends(get_cache),
):
    key = f"product:{slug}"
    cached = await cache.get_json(key)
    if cached is not None:
        return cached
    product = await get_product_by_slug(db, slug)
    payload = product_read(product).model_dump(by_alias=True)
    await cache.set_json(key, payload, ttl_seconds=60)
    return payload


@app.get("/api/v1/products/{slug}/sessions", response_model=list[SessionRead])
async def product_sessions(slug: str, db: AsyncSession = Depends(get_read_session)):
    product = await get_product_by_slug(db, slug)
    sessions = await get_family_sessions(db, product.id)
    return [session_read(session) for session in sessions]


@app.get("/api/v1/sessions", response_model=list[SessionRead])
async def sessions_list(db: AsyncSession = Depends(get_read_session)):
    rows = await db.scalars(select(Session).options(selectinload(Session.participants)).order_by(Session.created_at.desc()))
    return [session_read(session) for session in rows.all()]


@app.get("/api/v1/sessions/{session_id}", response_model=SessionRead)
async def session_detail(session_id: UUID, db: AsyncSession = Depends(get_read_session), cache: Cache = Depends(get_cache)):
    key = f"session:{session_id}"
    cached = await cache.get_json(key)
    if cached is not None:
        return cached
    session = await get_session_by_id(db, session_id)
    payload = session_read(session).model_dump(by_alias=True)
    await cache.set_json(key, payload, ttl_seconds=20)
    return payload


@app.get("/api/v1/sessions/{session_id}/cart", response_model=CartRead)
async def session_cart(
    session_id: UUID,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
):
    cart = await list_cart(db, session_id=session_id, user_id=user.id)
    return cart_read(cart)


@app.post("/api/v1/sessions/{session_id}/cart/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    session_id: UUID,
    payload: CartItemUpsert,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
    cache: Cache = Depends(get_cache),
):
    cart = await upsert_cart_item(db, session_id=session_id, user_id=user.id, payload=payload)
    await db.commit()
    await cache.delete(f"session:{session_id}", f"cart:{session_id}:{user.id}")
    return cart_read(cart)


@app.patch("/api/v1/sessions/{session_id}/cart/items/{item_id}", response_model=CartRead)
async def update_cart_item(
    session_id: UUID,
    item_id: UUID,
    payload: CartItemPatch,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
    cache: Cache = Depends(get_cache),
):
    cart = await patch_cart_item(db, session_id=session_id, item_id=item_id, quantity=payload.quantity)
    await db.commit()
    await cache.delete(f"session:{session_id}", f"cart:{session_id}:{user.id}")
    return cart_read(cart)


@app.delete("/api/v1/sessions/{session_id}/cart/items/{item_id}", response_model=CartRead)
async def remove_cart_item(
    session_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
    cache: Cache = Depends(get_cache),
):
    cart = await delete_cart_item(db, session_id=session_id, item_id=item_id)
    await db.commit()
    await cache.delete(f"session:{session_id}", f"cart:{session_id}:{user.id}")
    return cart_read(cart)


@app.post("/api/v1/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session_endpoint(
    payload: CreateSessionInput,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
    cache: Cache = Depends(get_cache),
):
    gb_session = await create_session(db, creator=user, input=payload)
    await db.commit()
    await cache.delete_prefix("catalog:")
    return session_read(gb_session)


@app.post("/api/v1/sessions/{session_id}/join")
async def join_session_endpoint(
    session_id: UUID,
    payload: JoinSessionInput,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
    cache: Cache = Depends(get_cache),
):
    result = await join_session_by_id(db, session_id=session_id, input=payload, current_user=user)
    await db.commit()
    await cache.delete(f"session:{session_id}")
    await cache.delete_prefix("catalog:")
    return {
        "session": session_read(result["session"]),
        "participation": ParticipationRead.model_validate(result["participation"]),
        "order": order_read(result["order"]),
        "refundDelta": result["refund_delta"],
    }


@app.post("/api/v1/orders/cart", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def checkout_cart(
    session_id: UUID | None = None,
    wallet_deduction: int = 0,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
):
    cart = await get_or_create_cart(db, session_id=session_id, user_id=user.id)
    await db.refresh(cart)
    order = await create_cart_order(db, current_user=user, cart=cart, wallet_deduction=wallet_deduction)
    await db.commit()
    return order_read(order)


@app.get("/api/v1/orders/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_session),
):
    order = await db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order_read(order)


@app.get("/api/v1/orders", response_model=list[OrderRead])
async def list_orders(
    user: User = Depends(verified_user),
    db: AsyncSession = Depends(get_session),
):
    rows = await db.scalars(select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()))
    return [order_read(order) for order in rows.all()]


@app.post("/api/v1/orders/{order_id}/confirm", response_model=OrderRead)
async def confirm_order_endpoint(
    order_id: UUID,
    payload: OrderConfirmInput,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(verified_user),
):
    order = await db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order = await confirm_order(db, order=order, shipping_address=payload.shipping_address)
    await db.commit()
    return order_read(order)


@app.get("/api/v1/wallet/transactions", response_model=list[WalletTransactionRead])
async def wallet_transactions(user: User = Depends(verified_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(WalletTransaction).where(WalletTransaction.user_id == user.id).order_by(WalletTransaction.created_at.desc()))
    return [WalletTransactionRead.model_validate(row) for row in rows.all()]


@app.get("/api/v1/withdrawals", response_model=list[WithdrawalRequestRead])
async def withdrawals(user: User = Depends(verified_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(WithdrawalRequest).where(WithdrawalRequest.user_id == user.id).order_by(WithdrawalRequest.created_at.desc()))
    return [WithdrawalRequestRead.model_validate(row) for row in rows.all()]


@app.post("/api/v1/withdrawals", response_model=WithdrawalRequestRead, status_code=status.HTTP_201_CREATED)
async def create_withdrawal_endpoint(
    amount: int,
    user: User = Depends(verified_user),
    db: AsyncSession = Depends(get_session),
):
    withdrawal = await create_withdrawal(db, current_user=user, amount=amount)
    await db.commit()
    return WithdrawalRequestRead.model_validate(withdrawal)


@app.get("/api/v1/seller/dashboard")
async def seller_dashboard(user: User = Depends(seller_user), db: AsyncSession = Depends(get_session)):
    return await get_seller_dashboard(db, user=user)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return ORJSONResponse({"detail": exc.detail}, status_code=exc.status_code)


@app.exception_handler(EmailDeliveryError)
async def email_delivery_exception_handler(_: Request, exc: EmailDeliveryError):
    logger.warning("email_delivery_failed", error=str(exc))
    return ORJSONResponse({"detail": str(exc)}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("unhandled_error", error=str(exc))
    return ORJSONResponse({"detail": "Internal server error"}, status_code=500)
