from functools import lru_cache
import os

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sidrat API"
    env: str = Field(default="dev", validation_alias="APP_ENV")
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(
        default="postgresql+asyncpg://sidrat:sidrat@localhost:5432/sidrat",
        validation_alias="DATABASE_URL",
    )
    read_database_url: str | None = Field(default=None, validation_alias="READ_DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")

    secret_key: str = Field(default="change-me", validation_alias="SECRET_KEY")
    access_token_ttl_minutes: int = 60 * 24
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"], validation_alias="CORS_ORIGINS")
    bootstrap_database: bool | None = Field(default=None, validation_alias="BOOTSTRAP_DATABASE")
    seed_demo_data: bool | None = Field(default=None, validation_alias="SEED_DEMO_DATA")
    allow_demo_auth: bool | None = Field(default=None, validation_alias="ALLOW_DEMO_AUTH")
    verification_code_ttl_minutes: int = 15
    smtp_host: str | None = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, validation_alias="SMTP_USERNAME")
    smtp_password: str | None = Field(default=None, validation_alias="SMTP_PASSWORD")
    smtp_from_email: str | None = Field(default=None, validation_alias="SMTP_FROM_EMAIL")
    mail_from_name: str = Field(default="SIDRAT", validation_alias="MAIL_FROM_NAME")
    smtp_use_starttls: bool = Field(default=True, validation_alias="SMTP_USE_STARTTLS")
    smtp_use_ssl: bool = Field(default=False, validation_alias="SMTP_USE_SSL")
    smtp_timeout_seconds: int = Field(default=20, validation_alias="SMTP_TIMEOUT_SECONDS")

    db_pool_size: int = 20
    db_max_overflow: int = 40
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    default_user_id: str = "11111111-1111-1111-1111-111111111111"

    gunicorn_workers: int = 2
    log_level: str = "INFO"

    @field_validator("smtp_password", mode="before")
    @classmethod
    def normalize_smtp_password(cls, value):
        if isinstance(value, str):
            return value.replace(" ", "")
        return value

    @field_validator("database_url", "read_database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value):
        if not isinstance(value, str) or not value:
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def apply_bootstrap_defaults(self):
        is_production = os.getenv("APP_ENV", self.env).lower() == "production"
        if self.bootstrap_database is None:
            self.bootstrap_database = not is_production
        if self.seed_demo_data is None:
            self.seed_demo_data = not is_production
        if self.allow_demo_auth is None:
            self.allow_demo_auth = not is_production
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
