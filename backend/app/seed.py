from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Participation, Product, ProductVariant, Session, User, WalletTransaction
from app.security import hash_password


def uid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


async def seed_demo_data(db: AsyncSession) -> None:
    existing_users = await db.scalar(text("select count(*) from users"))
    if existing_users and int(existing_users) > 0:
        return

    buyer = User(
        id=uid("11111111-1111-1111-1111-111111111111"),
        email="buyer@example.com",
        name="Demo Buyer",
        role="buyer",
        password_hash=hash_password("buyer-demo-password"),
        email_verified_at=datetime.now(tz=UTC),
        wallet_balance=1700,
        referral_code="BUYER1",
        full_name="Demo Buyer",
    )
    seller = User(
        id=uid("22222222-2222-2222-2222-222222222222"),
        email="seller@example.com",
        name="Demo Seller",
        role="seller",
        password_hash=hash_password("seller-demo-password"),
        email_verified_at=datetime.now(tz=UTC),
        wallet_balance=300,
        referral_code="SELLER1",
        full_name="Demo Seller",
    )
    admin = User(
        id=uid("33333333-3333-3333-3333-333333333333"),
        email="admin@example.com",
        name="Admin User",
        role="admin",
        password_hash=hash_password("admin-demo-password"),
        email_verified_at=datetime.now(tz=UTC),
        wallet_balance=0,
        referral_code="ADMIN1",
        full_name="Admin User",
    )
    for user in (buyer, seller, admin):
        db.add(user)
        await db.flush()

    products = [
        Product(
            id=uid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            slug="nike-air-max-2024",
            name="Nike Air Max 2024",
            description="Гибкая GB-сессия на одну модель с доступными размерами и цветами.",
            category="footwear",
            image="/assets/products/nike-air-max-2024/cover.svg",
            images=[
                "/assets/products/nike-air-max-2024/cover.svg",
                "/assets/products/nike-air-max-2024/alt-1.svg",
            ],
            base_price=1321,
            discount_step=5,
            max_discount=20,
            seller_id=seller.id,
            active=True,
            allowed_sizes=["41", "42", "43", "44"],
            shoe_size_ids=["ru41-eu42", "ru42-eu43", "ru43-eu44", "ru44-eu45"],
            allowed_colors=["Black", "White"],
            specs={"Размеры": "41-44", "Цвета": "Black / White", "Скидка": "5% за слот"},
            supports_gb2=True,
            currency="RUB",
            variant_strategy="size-color",
        ),
        Product(
            id=uid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            slug="oxford-shirt",
            name="Oxford Classic Shirt",
            description="Рубашка с гибкой вариативностью по цвету и размерам в рамках одной GB-сессии.",
            category="apparel",
            image="/assets/products/oxford-shirt/cover.svg",
            images=["/assets/products/oxford-shirt/cover.svg", "/assets/products/oxford-shirt/alt-1.svg"],
            base_price=2190,
            discount_step=10,
            max_discount=30,
            seller_id=seller.id,
            active=True,
            allowed_sizes=["S", "M", "L", "XL"],
            allowed_colors=["Blue", "White"],
            specs={"Размеры": "S-XL", "Цвета": "Blue / White", "Скидка": "10% за слот"},
            supports_gb2=True,
            currency="RUB",
            variant_strategy="size-color",
        ),
        Product(
            id=uid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            slug="iphone-15-pro-max",
            name="iPhone 15 Pro Max",
            description="Флагманский смартфон для тех, кому нужен запас по памяти и скорости.",
            category="electronics",
            category_slug="electronics/smartphones/smartphones",
            image="/assets/products/iphone-15-pro-max/cover.svg",
            images=["/assets/products/iphone-15-pro-max/cover.svg", "/assets/products/iphone-15-pro-max/alt-1.svg"],
            base_price=119990,
            discount_step=3500,
            max_discount=15000,
            seller_id=seller.id,
            active=True,
            allowed_sizes=["256 GB", "512 GB"],
            allowed_colors=["Natural Titanium", "Black Titanium"],
            specs={"Память": "256 / 512 GB", "Чип": "A17 Pro"},
            supports_gb2=True,
            currency="RUB",
            variant_strategy="size-color",
        ),
        Product(
            id=uid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            slug="sony-wh-1000xm5",
            name="Sony WH-1000XM5",
            description="Аудио-family с двумя цветовыми вариантами внутри одной GB-сессии.",
            category="audio",
            image="/assets/products/sony-wh-1000xm5/cover.svg",
            images=["/assets/products/sony-wh-1000xm5/cover.svg"],
            base_price=18990,
            discount_step=5,
            max_discount=20,
            seller_id=seller.id,
            active=True,
            allowed_sizes=["One size"],
            allowed_colors=["Black", "Silver"],
            specs={"Цвета": "Black / Silver", "Скидка": "5% за слот"},
            supports_gb2=True,
            currency="RUB",
            variant_strategy="size-color",
        ),
    ]
    for product in products:
        db.add(product)
        await db.flush()

    product_variants = [
        ProductVariant(
            id=uid("aaaa0000-0000-0000-0000-000000000001"),
            product_id=products[0].id,
            family_id=products[0].id.hex,
            size="41",
            color="Black",
            sku="NAM-41-BLK",
            stock=6,
            image="/assets/products/nike-air-max-2024/cover.svg",
            is_allowed_in_gb=True,
        ),
        ProductVariant(
            id=uid("aaaa0000-0000-0000-0000-000000000002"),
            product_id=products[0].id,
            family_id=products[0].id.hex,
            size="42",
            color="Black",
            sku="NAM-42-BLK",
            stock=6,
            image="/assets/products/nike-air-max-2024/cover.svg",
            is_allowed_in_gb=True,
        ),
        ProductVariant(
            id=uid("bbbb0000-0000-0000-0000-000000000001"),
            product_id=products[1].id,
            family_id=products[1].id.hex,
            size="M",
            color="Blue",
            sku="OX-M-BLU",
            stock=8,
            image="/assets/products/oxford-shirt/cover.svg",
            is_allowed_in_gb=True,
        ),
        ProductVariant(
            id=uid("cccc0000-0000-0000-0000-000000000001"),
            product_id=products[2].id,
            family_id=products[2].id.hex,
            size="256 GB",
            color="Natural Titanium",
            sku="IP15P-256-NAT",
            stock=7,
            image="/assets/products/iphone-15-pro-max/cover.svg",
            is_allowed_in_gb=True,
        ),
        ProductVariant(
            id=uid("dddd0000-0000-0000-0000-000000000001"),
            product_id=products[3].id,
            family_id=products[3].id.hex,
            size="One size",
            color="Black",
            sku="SONY-BLK",
            stock=10,
            image="/assets/products/sony-wh-1000xm5/cover.svg",
            is_allowed_in_gb=True,
        ),
    ]
    for variant in product_variants:
        db.add(variant)
        await db.flush()

    session = Session(
        id=uid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        family_id=products[0].id,
        family_slug=products[0].slug,
        title="Air Max family group buy",
        description="Public session for the Air Max family.",
        created_by=seller.id,
        created_by_role=seller.role,
        access_type="public",
        status="active",
        target_slots=5,
        current_slots=2,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=72),
        allowed_sizes=["41", "42", "43", "44"],
        allowed_colors=["Black", "White"],
        base_price_snapshot=1321,
        discount_step_snapshot=5,
        max_discount_snapshot=20,
        current_floor_price=1255,
        last_settled_price=1255,
        invite_code="AIRMAX2024",
    )
    db.add(session)

    for participation in (
        Participation(
            id=uid("eeee0000-0000-0000-0000-000000000001"),
            session_id=session.id,
            user_id=buyer.id,
            user_name=buyer.name,
            variant_id=product_variants[0].id,
            size="41",
            color="Black",
            slot_number=1,
            price_paid=1321,
            status="paid",
        ),
        Participation(
            id=uid("eeee0000-0000-0000-0000-000000000002"),
            session_id=session.id,
            user_id=buyer.id,
            user_name=buyer.name,
            variant_id=product_variants[1].id,
            size="42",
            color="Black",
            slot_number=2,
            price_paid=1255,
            status="paid",
        ),
    ):
        db.add(participation)
        await db.flush()

    db.add(
        WalletTransaction(
            user_id=buyer.id,
            type="credit",
            amount=500,
            source="admin_adjustment",
            description="Demo bonus wallet top-up",
        )
    )

    await db.commit()
