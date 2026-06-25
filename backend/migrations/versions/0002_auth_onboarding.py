"""auth onboarding"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0002_auth_onboarding"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_email_verified_at", "users", ["email_verified_at"], unique=False)

    op.create_table(
        "email_verification_challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("referral_code", sa.String(length=64)),
        sa.Column("verification_code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_email_verification_challenges_email", "email_verification_challenges", ["email"], unique=True)
    op.create_index("ix_email_verification_challenges_referral_code", "email_verification_challenges", ["referral_code"], unique=False)
    op.create_index("ix_email_verification_challenges_expires_at", "email_verification_challenges", ["expires_at"], unique=False)
    op.create_index("ix_email_verification_challenges_verified_at", "email_verification_challenges", ["verified_at"], unique=False)

    op.create_table(
        "seller_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255)),
        sa.Column("phone", sa.String(length=64)),
        sa.Column("message", sa.Text()),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("approved_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_seller_applications_email", "seller_applications", ["email"], unique=False)
    op.create_index("ix_seller_applications_status", "seller_applications", ["status"], unique=False)
    op.create_index("ix_seller_applications_decided_at", "seller_applications", ["decided_at"], unique=False)
    op.create_index("ix_seller_applications_decided_by", "seller_applications", ["decided_by"], unique=False)
    op.create_index("ix_seller_applications_approved_user_id", "seller_applications", ["approved_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_seller_applications_approved_user_id", table_name="seller_applications")
    op.drop_index("ix_seller_applications_decided_by", table_name="seller_applications")
    op.drop_index("ix_seller_applications_decided_at", table_name="seller_applications")
    op.drop_index("ix_seller_applications_status", table_name="seller_applications")
    op.drop_index("ix_seller_applications_email", table_name="seller_applications")
    op.drop_table("seller_applications")

    op.drop_index("ix_email_verification_challenges_verified_at", table_name="email_verification_challenges")
    op.drop_index("ix_email_verification_challenges_expires_at", table_name="email_verification_challenges")
    op.drop_index("ix_email_verification_challenges_referral_code", table_name="email_verification_challenges")
    op.drop_index("ix_email_verification_challenges_email", table_name="email_verification_challenges")
    op.drop_table("email_verification_challenges")

    op.drop_index("ix_users_email_verified_at", table_name="users")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "password_hash")
