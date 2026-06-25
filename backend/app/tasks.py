from __future__ import annotations

from celery import Celery

from app.settings import get_settings


settings = get_settings()

celery_app = Celery(
    "sidrat",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="session.expire_due_sessions")
def expire_due_sessions() -> str:
    return "scheduled"


@celery_app.task(name="cache.invalidate_catalog")
def invalidate_catalog() -> str:
    return "scheduled"
