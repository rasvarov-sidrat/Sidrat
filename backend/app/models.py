from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import CHAR, TypeDecorator


class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        text = str(value)
        if len(text) == 32:
            return uuid.UUID(hex=text)
        return uuid.UUID(text)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Role(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    admin = "admin"


class AccessType(str, enum.Enum):
    public = "public"
    invite_link = "invite-link"


class SessionStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    expired = "expired"
    completed = "completed"
    cancelled = "cancelled"


class ParticipationStatus(str, enum.Enum):
    paid = "paid"
    joined = "joined"
    cancelled = "cancelled"
    refunded = "refunded"


class OrderStatus(str, enum.Enum):
    created = "created"
    confirmed = "confirmed"
    processing = "processing"
    fulfilled = "fulfilled"
    cancelled = "cancelled"


class TransactionType(str, enum.Enum):
    credit = "credit"
    debit = "debit"


class TransactionSource(str, enum.Enum):
    slot_refund = "slot_refund"
    withdrawal = "withdrawal"
    wallet_spend = "wallet_spend"
    payment = "payment"
    admin_adjustment = "admin_adjustment"
    referral_reward = "referral_reward"


class WithdrawalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    expired = "expired"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ContentStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class MediaKind(str, enum.Enum):
    hero = "hero"
    product = "product"
    page = "page"
    generic = "generic"


class BlockType(str, enum.Enum):
    hero = "hero"
    text = "text"
    cta = "cta"
    grid = "grid"
    media = "media"
    faq = "faq"
    feature_list = "feature_list"
    product_slider = "product_slider"
    promo_banner = "promo_banner"


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    category_slug: Mapped[str | None] = mapped_column(String(255), index=True)
    image: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    base_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_step: Mapped[int] = mapped_column(Integer, nullable=False)
    max_discount: Mapped[int] = mapped_column(Integer, nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    allowed_sizes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    shoe_size_ids: Mapped[list[str] | None] = mapped_column(JSON)
    allowed_colors: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    specs: Mapped[dict[str, str] | None] = mapped_column(JSON)
    tags: Mapped[list[str] | None] = mapped_column(JSON)
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2))
    reviews: Mapped[int | None] = mapped_column(Integer)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_gb2: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    original_price: Mapped[int | None] = mapped_column(Integer)
    price: Mapped[int | None] = mapped_column(Integer)
    landed_cost: Mapped[int | None] = mapped_column(Integer)
    packaging_cost: Mapped[int | None] = mapped_column(Integer)
    fulfillment_cost: Mapped[int | None] = mapped_column(Integer)
    platform_fee_percent: Mapped[int | None] = mapped_column(Integer)
    payment_fee_percent: Mapped[int | None] = mapped_column(Integer)
    tax_reserve_percent: Mapped[int | None] = mapped_column(Integer)
    margin_target_percent: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="RUB", nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    variant_strategy: Mapped[str | None] = mapped_column(String(32))
    display_template: Mapped[str | None] = mapped_column(String(64))
    display_config: Mapped[dict | None] = mapped_column(JSON)

    seller = relationship("User", foreign_keys=[seller_id])
    variants = relationship("ProductVariant", cascade="all, delete-orphan", back_populates="product")


class ProductVariant(Base, TimestampMixin):
    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("products.id"), index=True, nullable=False)
    family_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    size: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    color_hex: Mapped[str | None] = mapped_column(String(32))
    sku: Mapped[str | None] = mapped_column(String(128), index=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image: Mapped[str | None] = mapped_column(Text)
    images: Mapped[list[str] | None] = mapped_column(JSON)
    price: Mapped[int | None] = mapped_column(Integer)
    is_allowed_in_gb: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    product = relationship("Product", back_populates="variants")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    wallet_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    referral_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    avatar: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(64))
    referred_by: Mapped[str | None] = mapped_column(String(64), index=True)
    bonus_balance: Mapped[int | None] = mapped_column(Integer)
    full_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)


class MediaAsset(Base, TimestampMixin):
    __tablename__ = "media_assets"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default=MediaKind.generic.value)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(128))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    usage: Mapped[str | None] = mapped_column(String(255), index=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON)
    asset_meta: Mapped[dict | None] = mapped_column("metadata", JSON)
    status: Mapped[str] = mapped_column(String(16), default=ContentStatus.published.value, nullable=False, index=True)


class CmsPage(Base, TimestampMixin):
    __tablename__ = "cms_pages"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    template_key: Mapped[str] = mapped_column(String(64), default="standard", nullable=False)
    seo_title: Mapped[str | None] = mapped_column(String(255))
    seo_description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default=ContentStatus.draft.value, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    settings: Mapped[dict | None] = mapped_column(JSON)

    blocks = relationship("CmsBlock", cascade="all, delete-orphan", back_populates="page", order_by="CmsBlock.position")


class CmsBlock(Base, TimestampMixin):
    __tablename__ = "cms_blocks"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("cms_pages.id"), index=True, nullable=False)
    block_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    subtitle: Mapped[str | None] = mapped_column(String(255))
    body: Mapped[str | None] = mapped_column(Text)
    cta_text: Mapped[str | None] = mapped_column(String(255))
    cta_link: Mapped[str | None] = mapped_column(String(255))
    media_asset_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("media_assets.id"), index=True)
    props: Mapped[dict | None] = mapped_column(JSON)
    template_key: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(16), default=ContentStatus.draft.value, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)

    page = relationship("CmsPage", back_populates="blocks")
    media_asset = relationship("MediaAsset")


class HeroSlide(Base, TimestampMixin):
    __tablename__ = "hero_slides"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    cta_text: Mapped[str | None] = mapped_column(String(255))
    cta_link: Mapped[str | None] = mapped_column(String(255))
    media_asset_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("media_assets.id"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default=ContentStatus.published.value, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    props: Mapped[dict | None] = mapped_column(JSON)

    media_asset = relationship("MediaAsset")


class ProductDisplayConfig(Base, TimestampMixin):
    __tablename__ = "product_display_configs"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("products.id"), unique=True, index=True, nullable=False)
    template_key: Mapped[str] = mapped_column(String(64), default="standard", nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255))
    subtitle: Mapped[str | None] = mapped_column(String(255))
    badge_text: Mapped[str | None] = mapped_column(String(255))
    cta_text: Mapped[str | None] = mapped_column(String(255))
    cta_link: Mapped[str | None] = mapped_column(String(255))
    hero_media_asset_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("media_assets.id"), index=True)
    gallery_media_asset_ids: Mapped[list[str] | None] = mapped_column(JSON)
    specs: Mapped[dict | None] = mapped_column(JSON)
    sections: Mapped[list[dict] | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(16), default=ContentStatus.draft.value, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    props: Mapped[dict | None] = mapped_column(JSON)

    product = relationship("Product")
    hero_media_asset = relationship("MediaAsset")


class ContentRevision(Base, TimestampMixin):
    __tablename__ = "content_revisions"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    note: Mapped[str | None] = mapped_column(Text)


class EmailVerificationChallenge(Base, TimestampMixin):
    __tablename__ = "email_verification_challenges"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    referral_code: Mapped[str | None] = mapped_column(String(64), index=True)
    verification_code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(16), default=VerificationStatus.pending.value, nullable=False)


class SellerApplication(Base, TimestampMixin):
    __tablename__ = "seller_applications"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(64))
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default=ApplicationStatus.pending.value, nullable=False, index=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    decided_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    approved_user_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    family_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("products.id"), index=True, nullable=False)
    family_slug: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    created_by_role: Mapped[str] = mapped_column(String(16), nullable=False)
    access_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), index=True, nullable=False, default=SessionStatus.active.value)
    target_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    current_slots: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    allowed_sizes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    allowed_colors: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    base_price_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_step_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    max_discount_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    current_floor_price: Mapped[int] = mapped_column(Integer, nullable=False)
    last_settled_price: Mapped[int] = mapped_column(Integer, nullable=False)
    invite_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    public_note: Mapped[str | None] = mapped_column(Text)

    participants = relationship("Participation", cascade="all, delete-orphan", back_populates="session", order_by="Participation.slot_number")


class Participation(Base, TimestampMixin):
    __tablename__ = "participations"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("sessions.id"), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("product_variants.id"), index=True, nullable=False)
    size: Mapped[str] = mapped_column(String(128), nullable=False)
    color: Mapped[str] = mapped_column(String(128), nullable=False)
    slot_number: Mapped[int] = mapped_column(Integer, nullable=False)
    price_paid: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default=ParticipationStatus.paid.value)

    session = relationship("Session", back_populates="participants")
    variant = relationship("ProductVariant")
    user = relationship("User")


class Cart(Base, TimestampMixin):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("sessions.id"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    total_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_original: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_discounted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    items = relationship("CartItem", cascade="all, delete-orphan", back_populates="cart", order_by="CartItem.added_at")


class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("carts.id"), index=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("products.id"), index=True, nullable=False)
    variant_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("product_variants.id"), index=True)
    product_name: Mapped[str | None] = mapped_column(String(255))
    variant_name: Mapped[str | None] = mapped_column(String(255))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int | None] = mapped_column(Integer)
    original_price: Mapped[int | None] = mapped_column(Integer)
    discounted_price: Mapped[int | None] = mapped_column(Integer)
    image: Mapped[str | None] = mapped_column(Text)
    size: Mapped[str | None] = mapped_column(String(128))
    color: Mapped[str | None] = mapped_column(String(128))
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    cart = relationship("Cart", back_populates="items")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    session_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("sessions.id"), index=True)
    family_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("products.id"), index=True)
    seller_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
    category_slug: Mapped[str | None] = mapped_column(String(255), index=True)
    participation_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("participations.id"), index=True)
    family_name: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_label: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    wallet_deduction: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(16), index=True, nullable=False, default=OrderStatus.created.value)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipping_address: Mapped[dict | None] = mapped_column(JSON)


class WalletTransaction(Base, TimestampMixin):
    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    related_session_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("sessions.id"), index=True)
    related_order_id: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("orders.id"), index=True)


class WithdrawalRequest(Base, TimestampMixin):
    __tablename__ = "withdrawal_requests"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    fee_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    net_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), index=True, nullable=False, default=WithdrawalStatus.pending.value)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decided_by: Mapped[uuid.UUID | None] = mapped_column(GUID, ForeignKey("users.id"), index=True)
