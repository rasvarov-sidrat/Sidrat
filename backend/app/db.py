from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base
from app.settings import Settings, get_settings


def build_engine(url: str, *, pool_size: int, max_overflow: int, pool_timeout: int, pool_recycle: int) -> AsyncEngine:
    if url.startswith("sqlite"):
        return create_async_engine(url, future=True, use_insertmanyvalues=False)
    return create_async_engine(
        url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
        future=True,
    )


settings = get_settings()
engine = build_engine(
    settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
)
read_engine = build_engine(
    settings.read_database_url or settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
ReadSessionLocal = async_sessionmaker(read_engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def get_read_session() -> AsyncIterator[AsyncSession]:
    async with ReadSessionLocal() as session:
        yield session


async def init_db() -> None:
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from sqlalchemy import inspect, text

    alembic_ini = Path(__file__).resolve().parents[1] / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini))
    head_rev = ScriptDirectory.from_config(alembic_cfg).get_current_head()

    async with engine.begin() as conn:
        def bootstrap(sync_conn):
            insp = inspect(sync_conn)
            tables = set(insp.get_table_names())
            version = None
            if "alembic_version" in tables:
                row = sync_conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).fetchone()
                version = row[0] if row else None
            if "users" in tables:
                user_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(users)")).fetchall()}
                if "is_active" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))
                sync_conn.execute(
                    text("UPDATE users SET email = REPLACE(email, '@sidrat.local', '@example.com') WHERE email LIKE '%@sidrat.local'")
                )
            if "products" in tables:
                product_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(products)")).fetchall()}
                if "display_template" not in product_cols:
                    sync_conn.execute(text("ALTER TABLE products ADD COLUMN display_template VARCHAR(64)"))
                if "display_config" not in product_cols:
                    sync_conn.execute(text("ALTER TABLE products ADD COLUMN display_config JSON"))
            return tables, version

        tables, version = await conn.run_sync(bootstrap)

    if version == head_rev:
        return

    def detect_stamp(tables: set[str]) -> str | None:
        if "cms_pages" in tables:
            return "0003_admin_cms"
        if "email_verification_challenges" in tables:
            return "0002_auth_onboarding"
        if "users" in tables:
            return "0001_initial"
        return None

    if not tables or "users" not in tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        command.stamp(alembic_cfg, head_rev)
        return

    if "users" in tables:
        if "products" not in tables and len(tables) <= 3:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)
            command.stamp(alembic_cfg, head_rev)
            return

        stamp_rev = detect_stamp(tables)
        if stamp_rev and version != stamp_rev:
            command.stamp(alembic_cfg, stamp_rev)
        if stamp_rev != head_rev:
            command.upgrade(alembic_cfg, "head")
        return

    command.upgrade(alembic_cfg, "head")


async def ping_db(session: AsyncSession) -> bool:
    result = await session.execute(text("select 1"))
    return result.scalar_one() == 1
