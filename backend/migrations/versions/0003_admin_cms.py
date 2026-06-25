"""admin cms"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0003_admin_cms"
down_revision = "0002_auth_onboarding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.create_index("ix_users_is_active", "users", ["is_active"], unique=False)

    op.add_column("products", sa.Column("display_template", sa.String(length=64), nullable=True))
    op.add_column("products", sa.Column("display_config", sa.JSON(), nullable=True))

    op.create_table(
        "media_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("alt_text", sa.String(length=255)),
        sa.Column("kind", sa.String(length=32), nullable=False, server_default="generic"),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(length=128)),
        sa.Column("width", sa.Integer()),
        sa.Column("height", sa.Integer()),
        sa.Column("usage", sa.String(length=255)),
        sa.Column("tags", sa.JSON()),
        sa.Column("metadata", sa.JSON()),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="published"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_media_assets_key", "media_assets", ["key"], unique=True)
    op.create_index("ix_media_assets_kind", "media_assets", ["kind"], unique=False)
    op.create_index("ix_media_assets_usage", "media_assets", ["usage"], unique=False)
    op.create_index("ix_media_assets_status", "media_assets", ["status"], unique=False)

    op.create_table(
        "cms_pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("template_key", sa.String(length=64), nullable=False, server_default="standard"),
        sa.Column("seo_title", sa.String(length=255)),
        sa.Column("seo_description", sa.Text()),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("published_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("settings", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_cms_pages_slug", "cms_pages", ["slug"], unique=True)
    op.create_index("ix_cms_pages_status", "cms_pages", ["status"], unique=False)
    op.create_index("ix_cms_pages_published_at", "cms_pages", ["published_at"], unique=False)
    op.create_index("ix_cms_pages_published_by", "cms_pages", ["published_by"], unique=False)

    op.create_table(
        "cms_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
        sa.Column("block_type", sa.String(length=32), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("title", sa.String(length=255)),
        sa.Column("subtitle", sa.String(length=255)),
        sa.Column("body", sa.Text()),
        sa.Column("cta_text", sa.String(length=255)),
        sa.Column("cta_link", sa.String(length=255)),
        sa.Column("media_asset_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_assets.id")),
        sa.Column("props", sa.JSON()),
        sa.Column("template_key", sa.String(length=64)),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("published_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_cms_blocks_page_id", "cms_blocks", ["page_id"], unique=False)
    op.create_index("ix_cms_blocks_block_type", "cms_blocks", ["block_type"], unique=False)
    op.create_index("ix_cms_blocks_position", "cms_blocks", ["position"], unique=False)
    op.create_index("ix_cms_blocks_status", "cms_blocks", ["status"], unique=False)

    op.create_table(
        "hero_slides",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.String(length=255)),
        sa.Column("description", sa.Text()),
        sa.Column("cta_text", sa.String(length=255)),
        sa.Column("cta_link", sa.String(length=255)),
        sa.Column("media_asset_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_assets.id")),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="published"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("published_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("props", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_hero_slides_position", "hero_slides", ["position"], unique=False)
    op.create_index("ix_hero_slides_visible", "hero_slides", ["visible"], unique=False)
    op.create_index("ix_hero_slides_status", "hero_slides", ["status"], unique=False)

    op.create_table(
        "product_display_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False, unique=True),
        sa.Column("template_key", sa.String(length=64), nullable=False, server_default="standard"),
        sa.Column("headline", sa.String(length=255)),
        sa.Column("subtitle", sa.String(length=255)),
        sa.Column("badge_text", sa.String(length=255)),
        sa.Column("cta_text", sa.String(length=255)),
        sa.Column("cta_link", sa.String(length=255)),
        sa.Column("hero_media_asset_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_assets.id")),
        sa.Column("gallery_media_asset_ids", sa.JSON()),
        sa.Column("specs", sa.JSON()),
        sa.Column("sections", sa.JSON()),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("published_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("props", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_product_display_configs_product_id", "product_display_configs", ["product_id"], unique=True)
    op.create_index("ix_product_display_configs_status", "product_display_configs", ["status"], unique=False)

    op.create_table(
        "content_revisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("note", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_content_revisions_entity_type", "content_revisions", ["entity_type"], unique=False)
    op.create_index("ix_content_revisions_entity_id", "content_revisions", ["entity_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_content_revisions_entity_id", table_name="content_revisions")
    op.drop_index("ix_content_revisions_entity_type", table_name="content_revisions")
    op.drop_table("content_revisions")

    op.drop_index("ix_product_display_configs_status", table_name="product_display_configs")
    op.drop_index("ix_product_display_configs_product_id", table_name="product_display_configs")
    op.drop_table("product_display_configs")

    op.drop_index("ix_hero_slides_status", table_name="hero_slides")
    op.drop_index("ix_hero_slides_visible", table_name="hero_slides")
    op.drop_index("ix_hero_slides_position", table_name="hero_slides")
    op.drop_table("hero_slides")

    op.drop_index("ix_cms_blocks_status", table_name="cms_blocks")
    op.drop_index("ix_cms_blocks_position", table_name="cms_blocks")
    op.drop_index("ix_cms_blocks_block_type", table_name="cms_blocks")
    op.drop_index("ix_cms_blocks_page_id", table_name="cms_blocks")
    op.drop_table("cms_blocks")

    op.drop_index("ix_cms_pages_published_by", table_name="cms_pages")
    op.drop_index("ix_cms_pages_published_at", table_name="cms_pages")
    op.drop_index("ix_cms_pages_status", table_name="cms_pages")
    op.drop_index("ix_cms_pages_slug", table_name="cms_pages")
    op.drop_table("cms_pages")

    op.drop_index("ix_media_assets_status", table_name="media_assets")
    op.drop_index("ix_media_assets_usage", table_name="media_assets")
    op.drop_index("ix_media_assets_kind", table_name="media_assets")
    op.drop_index("ix_media_assets_key", table_name="media_assets")
    op.drop_table("media_assets")

    op.drop_column("products", "display_config")
    op.drop_column("products", "display_template")

    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_column("users", "is_active")
