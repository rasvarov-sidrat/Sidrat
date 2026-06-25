from __future__ import annotations

from fastapi import Depends, Header, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import Cache
from app.db import get_session
from app.models import Role, User
from app.security import decode_access_token
from app.settings import Settings, get_settings
from app.services import get_current_user


async def get_redis(request: Request) -> Redis | None:
    redis = getattr(request.app.state, "redis", None)
    if redis is not None:
        return redis
    return None


async def get_cache(redis: Redis | None = Depends(get_redis)) -> Cache:
    return Cache(redis)


async def current_user(
    db: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> User:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            subject = decode_access_token(token)
        except Exception as exc:  # pragma: no cover - jwt errors are runtime-specific
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from exc
        user = await get_current_user(db, subject, settings.default_user_id, allow_demo_fallback=False)
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")
        if not user.email_verified_at:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
        return user

    if settings.allow_demo_auth:
        user = await get_current_user(db, x_user_id, settings.default_user_id, allow_demo_fallback=True)
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")
        if user.email_verified_at:
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


async def verified_user(user: User = Depends(current_user)) -> User:
    if not user.email_verified_at:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
    return user


async def seller_user(user: User = Depends(verified_user)) -> User:
    if user.role not in {Role.seller.value, Role.admin.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seller access required")
    return user


async def admin_user(user: User = Depends(verified_user)) -> User:
    if user.role != Role.admin.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
