from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any, TypeVar

from redis.asyncio import Redis

T = TypeVar("T")


class Cache:
    def __init__(self, redis: Redis | None) -> None:
        self.redis = redis

    async def get_json(self, key: str) -> Any | None:
        if not self.redis:
            return None
        payload = await self.redis.get(key)
        return json.loads(payload) if payload else None

    async def set_json(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        if not self.redis:
            return
        await self.redis.set(key, json.dumps(value, ensure_ascii=False, default=str), ex=ttl_seconds)

    async def delete(self, *keys: str) -> None:
        if not self.redis or not keys:
            return
        await self.redis.delete(*keys)

    async def delete_prefix(self, prefix: str) -> None:
        if not self.redis:
            return
        keys = [key async for key in self.redis.scan_iter(match=f"{prefix}*")]
        if keys:
            await self.redis.delete(*keys)


def cached(key_builder: Callable[..., str], ttl_seconds: int = 60):
    def decorator(func: Callable[..., Awaitable[T]]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache: Cache | None = kwargs.get("cache")
            if not cache:
                return await func(*args, **kwargs)
            key = key_builder(*args, **kwargs)
            cached_value = await cache.get_json(key)
            if cached_value is not None:
                return cached_value
            value = await func(*args, **kwargs)
            await cache.set_json(key, value, ttl_seconds=ttl_seconds)
            return value

        return wrapper

    return decorator
