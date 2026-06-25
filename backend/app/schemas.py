from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_email(value: str) -> str:
    if not isinstance(value, str):
        raise TypeError("email must be a string")
    normalized = value.strip().lower()
    if not _EMAIL_RE.match(normalized):
        raise ValueError("Invalid email address")
    return normalized


SidratEmail = Annotated[str, BeforeValidator(_validate_email)]


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)


class ORMBase(ApiModel):
    pass


class ProductVariantRead(ORMBase):
    id: uuid.UUID
    family_id: str
    size: str
    color: str
    color_hex: str | None = None
    sku: str | None = None
    stock: int
    image: str | None = None
    images: list[str] | None = None
    price: int | None = None
    is_allowed_in_gb: bool


class ProductRead(ORMBase):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    category: str
    category_slug: str | None = None
    image: str
    images: list[str]
    base_price: int
    discount_step: int
    max_discount: int
    seller_id: uuid.UUID
    active: bool
    allowed_sizes: list[str]
    shoe_size_ids: list[str] | None = None
    allowed_colors: list[str]
    specs: dict[str, str] | None = None
    tags: list[str] | None = None
    rating: float | None = None
    reviews: int | None = None
    in_stock: bool
    supports_gb2: bool
    original_price: int | None = None
    price: int | None = None
    landed_cost: int | None = None
    packaging_cost: int | None = None
    fulfillment_cost: int | None = None
    platform_fee_percent: int | None = None
    payment_fee_percent: int | None = None
    tax_reserve_percent: int | None = None
    margin_target_percent: int | None = None
    currency: str
    archived_at: datetime | None = None
    variant_strategy: str | None = None
    created_at: datetime
    updated_at: datetime
    variants: list[ProductVariantRead] = []


class UserRead(ORMBase):
    id: uuid.UUID
    email: SidratEmail
    name: str
    role: str
    email_verified_at: datetime | None = None
    is_active: bool = True
    wallet_balance: int
    referral_code: str
    avatar: str | None = None
    phone: str | None = None
    referred_by: str | None = None
    created_at: datetime
    updated_at: datetime
    bonus_balance: int | None = None
    full_name: str | None = None


class ParticipationRead(ORMBase):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    variant_id: uuid.UUID
    size: str
    color: str
    slot_number: int
    price_paid: int
    status: str
    created_at: datetime


class SessionRead(ORMBase):
    id: uuid.UUID
    family_id: uuid.UUID
    family_slug: str
    title: str
    description: str | None = None
    created_by: uuid.UUID
    created_by_role: str
    access_type: str
    status: str
    target_slots: int
    current_slots: int
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    allowed_sizes: list[str]
    allowed_colors: list[str]
    base_price_snapshot: int
    discount_step_snapshot: int
    max_discount_snapshot: int
    current_floor_price: int
    last_settled_price: int
    invite_code: str
    public_note: str | None = None
    participants: list[ParticipationRead] = []


class CartItemRead(ORMBase):
    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    product_name: str | None = None
    variant_name: str | None = None
    quantity: int
    unit_price: int | None = None
    original_price: int | None = None
    discounted_price: int | None = None
    image: str | None = None
    size: str | None = None
    color: str | None = None
    added_at: datetime


class CartRead(ORMBase):
    id: uuid.UUID
    session_id: uuid.UUID | None = None
    items: list[CartItemRead]
    total_units: int
    total_original: int
    total_discounted: int
    created_at: datetime
    updated_at: datetime


class OrderRead(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID
    session_id: uuid.UUID | None = None
    family_id: uuid.UUID | None = None
    seller_id: uuid.UUID | None = None
    category_slug: str | None = None
    participation_id: uuid.UUID | None = None
    family_name: str
    variant_label: str
    total_amount: int
    wallet_deduction: int
    status: str
    created_at: datetime
    updated_at: datetime
    fulfilled_at: datetime | None = None
    shipping_address: dict | None = None


class WalletTransactionRead(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    amount: int
    source: str
    description: str
    related_session_id: uuid.UUID | None = None
    related_order_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class WithdrawalRequestRead(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: int
    fee_amount: int
    net_amount: int
    status: str
    created_at: datetime
    updated_at: datetime
    decided_at: datetime | None = None
    decided_by: uuid.UUID | None = None


class CartItemUpsert(ApiModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    product_name: str | None = None
    variant_name: str | None = None
    quantity: int = Field(ge=1)
    unit_price: int | None = None
    original_price: int | None = None
    discounted_price: int | None = None
    image: str | None = None
    size: str | None = None
    color: str | None = None


class CartItemPatch(ApiModel):
    quantity: int = Field(ge=0)


class JoinSessionInput(ApiModel):
    user_id: uuid.UUID | None = None
    variant_id: uuid.UUID
    wallet_spend: int = 0


class CreateSessionInput(ApiModel):
    family_id: str
    access_type: str = "public"
    expires_in_hours: int = Field(default=72, ge=1)
    allowed_sizes: list[str] = []
    allowed_colors: list[str] = []
    title: str | None = None
    description: str | None = None


class ShippingAddressInput(ApiModel):
    full_name: str
    phone: str
    address: str
    city: str
    region: str | None = None
    postal_code: str
    country: str


class OrderConfirmInput(ApiModel):
    shipping_address: ShippingAddressInput


class CatalogQuery(ApiModel):
    category: str | None = None
    q: str | None = None
    limit: int = 50
    offset: int = 0


class EmailVerificationRequest(ApiModel):
    email: SidratEmail
    name: str
    password: str = Field(min_length=6)
    referral_code: str | None = None


class EmailVerificationConfirm(ApiModel):
    email: SidratEmail
    code: str = Field(min_length=6, max_length=6)


class LoginInput(ApiModel):
    email: SidratEmail
    password: str


class AuthSessionRead(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class SellerApplicationCreate(ApiModel):
    email: SidratEmail
    name: str
    company_name: str | None = None
    phone: str | None = None
    message: str | None = None


class SellerApplicationRead(ORMBase):
    id: uuid.UUID
    email: SidratEmail
    name: str
    company_name: str | None = None
    phone: str | None = None
    message: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    decided_at: datetime | None = None
    decided_by: uuid.UUID | None = None
    approved_user_id: uuid.UUID | None = None


class SellerApplicationDecision(ApiModel):
    notes: str | None = None


class MediaAssetRead(ORMBase):
    id: uuid.UUID
    key: str
    label: str
    alt_text: str | None = None
    kind: str
    source_url: str
    mime_type: str | None = None
    width: int | None = None
    height: int | None = None
    usage: str | None = None
    tags: list[str] | None = None
    asset_meta: dict | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class MediaAssetUpsert(ApiModel):
    key: str
    label: str
    alt_text: str | None = None
    kind: str = "generic"
    source_url: str
    mime_type: str | None = None
    width: int | None = None
    height: int | None = None
    usage: str | None = None
    tags: list[str] | None = None
    asset_meta: dict | None = None
    status: str = "published"


class CmsBlockRead(ORMBase):
    id: uuid.UUID
    page_id: uuid.UUID
    block_type: str
    position: int
    visible: bool
    title: str | None = None
    subtitle: str | None = None
    body: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    media_asset_id: uuid.UUID | None = None
    props: dict | None = None
    template_key: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class CmsBlockUpsert(ApiModel):
    block_type: str
    position: int = 0
    visible: bool = True
    title: str | None = None
    subtitle: str | None = None
    body: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    media_asset_id: uuid.UUID | None = None
    props: dict | None = None
    template_key: str | None = None
    status: str = "draft"


class CmsPageRead(ORMBase):
    id: uuid.UUID
    slug: str
    title: str
    template_key: str
    seo_title: str | None = None
    seo_description: str | None = None
    status: str
    published_at: datetime | None = None
    published_by: uuid.UUID | None = None
    settings: dict | None = None
    blocks: list[CmsBlockRead] = []
    created_at: datetime
    updated_at: datetime


class CmsPageUpsert(ApiModel):
    slug: str
    title: str
    template_key: str = "standard"
    seo_title: str | None = None
    seo_description: str | None = None
    status: str = "draft"
    settings: dict | None = None


class HeroSlideRead(ORMBase):
    id: uuid.UUID
    title: str
    subtitle: str | None = None
    description: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    media_asset_id: uuid.UUID | None = None
    image: str | None = None
    position: int
    visible: bool
    status: str
    props: dict | None = None
    created_at: datetime
    updated_at: datetime


class HeroSlideUpsert(ApiModel):
    title: str
    subtitle: str | None = None
    description: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    media_asset_id: uuid.UUID | None = None
    position: int = 0
    visible: bool = True
    status: str = "published"
    props: dict | None = None


class ProductDisplayRead(ORMBase):
    id: uuid.UUID
    product_id: uuid.UUID
    template_key: str
    headline: str | None = None
    subtitle: str | None = None
    badge_text: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    hero_media_asset_id: uuid.UUID | None = None
    hero_image_url: str | None = None
    gallery_media_asset_ids: list[str] | None = None
    gallery_urls: list[str] | None = None
    specs: dict | None = None
    sections: list[dict] | None = None
    status: str
    props: dict | None = None
    created_at: datetime
    updated_at: datetime


class ProductDisplayUpsert(ApiModel):
    template_key: str = "standard"
    headline: str | None = None
    subtitle: str | None = None
    badge_text: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    hero_media_asset_id: uuid.UUID | None = None
    gallery_media_asset_ids: list[str] | None = None
    specs: dict | None = None
    sections: list[dict] | None = None
    status: str = "draft"
    props: dict | None = None


class ContentRevisionRead(ORMBase):
    id: uuid.UUID
    entity_type: str
    entity_id: str
    action: str
    payload: dict
    created_by: uuid.UUID | None = None
    note: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminUserRead(UserRead):
    pass


class AdminUserUpsert(ApiModel):
    email: SidratEmail
    name: str
    role: str = "buyer"
    wallet_balance: int = 0
    phone: str | None = None
    referral_code: str | None = None
    full_name: str | None = None
    is_active: bool = True
    password: str | None = None
