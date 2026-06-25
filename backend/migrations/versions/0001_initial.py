"""initial schema"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("wallet_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("referral_code", sa.String(64), nullable=False),
        sa.Column("avatar", sa.Text()),
        sa.Column("phone", sa.String(64)),
        sa.Column("referred_by", sa.String(64)),
        sa.Column("bonus_balance", sa.Integer()),
        sa.Column("full_name", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_referral_code", "users", ["referral_code"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("category_slug", sa.String(255)),
        sa.Column("image", sa.Text(), nullable=False),
        sa.Column("images", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("base_price", sa.Integer(), nullable=False),
        sa.Column("discount_step", sa.Integer(), nullable=False),
        sa.Column("max_discount", sa.Integer(), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("allowed_sizes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("shoe_size_ids", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("allowed_colors", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("specs", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("rating", sa.Numeric(3, 2)),
        sa.Column("reviews", sa.Integer()),
        sa.Column("in_stock", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("supports_gb2", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("original_price", sa.Integer()),
        sa.Column("price", sa.Integer()),
        sa.Column("landed_cost", sa.Integer()),
        sa.Column("packaging_cost", sa.Integer()),
        sa.Column("fulfillment_cost", sa.Integer()),
        sa.Column("platform_fee_percent", sa.Integer()),
        sa.Column("payment_fee_percent", sa.Integer()),
        sa.Column("tax_reserve_percent", sa.Integer()),
        sa.Column("margin_target_percent", sa.Integer()),
        sa.Column("currency", sa.String(8), nullable=False, server_default="RUB"),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("variant_strategy", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_category", "products", ["category"])
    op.create_index("ix_products_active", "products", ["active"])
    op.create_index("ix_products_seller_id", "products", ["seller_id"])

    op.create_table(
        "product_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("family_id", sa.String(255), nullable=False),
        sa.Column("size", sa.String(128), nullable=False),
        sa.Column("color", sa.String(128), nullable=False),
        sa.Column("color_hex", sa.String(32)),
        sa.Column("sku", sa.String(128)),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("image", sa.Text()),
        sa.Column("images", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("price", sa.Integer()),
        sa.Column("is_allowed_in_gb", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])
    op.create_index("ix_product_variants_family_id", "product_variants", ["family_id"])
    op.create_index("ix_product_variants_size", "product_variants", ["size"])
    op.create_index("ix_product_variants_color", "product_variants", ["color"])
    op.create_index("ix_product_variants_sku", "product_variants", ["sku"])

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("family_slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_by_role", sa.String(16), nullable=False),
        sa.Column("access_type", sa.String(32), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("target_slots", sa.Integer(), nullable=False),
        sa.Column("current_slots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("allowed_sizes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("allowed_colors", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("base_price_snapshot", sa.Integer(), nullable=False),
        sa.Column("discount_step_snapshot", sa.Integer(), nullable=False),
        sa.Column("max_discount_snapshot", sa.Integer(), nullable=False),
        sa.Column("current_floor_price", sa.Integer(), nullable=False),
        sa.Column("last_settled_price", sa.Integer(), nullable=False),
        sa.Column("invite_code", sa.String(64), nullable=False),
        sa.Column("public_note", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_sessions_family_id", "sessions", ["family_id"])
    op.create_index("ix_sessions_family_slug", "sessions", ["family_slug"])
    op.create_index("ix_sessions_status", "sessions", ["status"])
    op.create_index("ix_sessions_expires_at", "sessions", ["expires_at"])
    op.create_index("ix_sessions_invite_code", "sessions", ["invite_code"], unique=True)

    op.create_table(
        "participations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_name", sa.String(255), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product_variants.id"), nullable=False),
        sa.Column("size", sa.String(128), nullable=False),
        sa.Column("color", sa.String(128), nullable=False),
        sa.Column("slot_number", sa.Integer(), nullable=False),
        sa.Column("price_paid", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_participations_session_id", "participations", ["session_id"])
    op.create_index("ix_participations_user_id", "participations", ["user_id"])
    op.create_index("ix_participations_variant_id", "participations", ["variant_id"])

    op.create_table(
        "carts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("total_units", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_original", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_discounted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_carts_session_id", "carts", ["session_id"])
    op.create_index("ix_carts_user_id", "carts", ["user_id"])

    op.create_table(
        "cart_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("carts.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product_variants.id")),
        sa.Column("product_name", sa.String(255)),
        sa.Column("variant_name", sa.String(255)),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Integer()),
        sa.Column("original_price", sa.Integer()),
        sa.Column("discounted_price", sa.Integer()),
        sa.Column("image", sa.Text()),
        sa.Column("size", sa.String(128)),
        sa.Column("color", sa.String(128)),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"])
    op.create_index("ix_cart_items_product_id", "cart_items", ["product_id"])
    op.create_index("ix_cart_items_variant_id", "cart_items", ["variant_id"])

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id")),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id")),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("category_slug", sa.String(255)),
        sa.Column("participation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("participations.id")),
        sa.Column("family_name", sa.String(255), nullable=False),
        sa.Column("variant_label", sa.String(255), nullable=False),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("wallet_deduction", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("fulfilled_at", sa.DateTime(timezone=True)),
        sa.Column("shipping_address", postgresql.JSONB(astext_type=sa.Text())),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_session_id", "orders", ["session_id"])
    op.create_index("ix_orders_family_id", "orders", ["family_id"])
    op.create_index("ix_orders_seller_id", "orders", ["seller_id"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_category_slug", "orders", ["category_slug"])

    op.create_table(
        "wallet_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(16), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(32), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("related_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id")),
        sa.Column("related_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_wallet_transactions_user_id", "wallet_transactions", ["user_id"])
    op.create_index("ix_wallet_transactions_source", "wallet_transactions", ["source"])
    op.create_index("ix_wallet_transactions_related_session_id", "wallet_transactions", ["related_session_id"])
    op.create_index("ix_wallet_transactions_related_order_id", "wallet_transactions", ["related_order_id"])

    op.create_table(
        "withdrawal_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("fee_amount", sa.Integer(), nullable=False),
        sa.Column("net_amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )
    op.create_index("ix_withdrawal_requests_user_id", "withdrawal_requests", ["user_id"])
    op.create_index("ix_withdrawal_requests_status", "withdrawal_requests", ["status"])
    op.create_index("ix_withdrawal_requests_decided_by", "withdrawal_requests", ["decided_by"])


def downgrade() -> None:
    op.drop_table("withdrawal_requests")
    op.drop_table("wallet_transactions")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("participations")
    op.drop_table("sessions")
    op.drop_table("product_variants")
    op.drop_table("products")
    op.drop_table("users")
