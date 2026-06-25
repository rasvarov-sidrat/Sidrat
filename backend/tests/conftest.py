from __future__ import annotations

import importlib

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture()
async def api_client(tmp_path, monkeypatch):
    db_url = f"sqlite+aiosqlite:///{(tmp_path / 'sidrat-test.db').as_posix()}"
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", db_url)
    monkeypatch.setenv("READ_DATABASE_URL", db_url)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6399/0")
    monkeypatch.setenv("BOOTSTRAP_DATABASE", "false")
    monkeypatch.setenv("SEED_DEMO_DATA", "false")
    monkeypatch.setenv("CORS_ORIGINS", "http://testclient")

    settings_module = importlib.import_module("app.settings")
    settings_module.get_settings.cache_clear()
    db_module = importlib.import_module("app.db")
    seed_module = importlib.import_module("app.seed")
    main_module = importlib.import_module("app.main")

    await db_module.init_db()
    async with db_module.SessionLocal() as session:
        await seed_module.seed_demo_data(session)

    transport = ASGITransport(app=main_module.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

