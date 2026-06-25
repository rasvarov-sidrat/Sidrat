from __future__ import annotations

import math
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, cast, func, or_, select, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cache import Cache
from app.models import (
    AccessType,
    Cart,
    CartItem,
    Order,
    OrderStatus,
    Participation,
    ParticipationStatus,
    Product,
    ProductVariant,
    Role,
    Session,
    SessionStatus,
    TransactionSource,
    TransactionType,
    User,
    WithdrawalRequest,
    WithdrawalStatus,
    WalletTransaction,
)
from app.schemas import CartItemUpsert, CreateSessionInput, JoinSessionInput, OrderConfirmInput, ShippingAddressInput

LOCAL_USER_ID_MAP = {
    "buyer-demo": uuid.UUID("11111111-1111-1111-1111-111111111111"),
    "seller-demo": uuid.UUID("22222222-2222-2222-2222-222222222222"),
    "admin-demo": uuid.UUID("33333333-3333-3333-3333-333333333333"),
}


def slot_count(discount_step: int, max_discount: int) -> int:
    if discount_step <= 0:
        return 1
    return math.floor(max_discount / discount_step) + 1


def calculate_slot_price(base_price: int, discount_step: int, max_discount: int, slot_number: int) -> int:
    raw_price = math.ceil(base_price * (100 - (slot_number - 1) * discount_step) / 100)
    floor_price = math.ceil(base_price * (100 - max_discount) / 100)
    return max(raw_price, floor_price)


def next_slot_price(session: Session) -> int:
    floor_price = math.ceil(session.base_price_snapshot * (100 - session.max_discount_snapshot) / 100)
    next_price = math.ceil(session.current_floor_price * (100 - session.discount_step_snapshot) / 100)
    return max(floor_price, next_price)


async def get_current_user(
    session: AsyncSession,
    user_id: str | None,
    default_user_id: str,
    *,
    allow_demo_fallback: bool = True,
) -> User:
    resolved_id: uuid.UUID | None = None
    if user_id:
        resolved_id = LOCAL_USER_ID_MAP.get(user_id)
        if resolved_id is None:
            try:
                resolved_id = uuid.UUID(user_id)
            except ValueError:
                resolved_id = None
    if resolved_id is not None:
        user = await session.scalar(select(User).where(User.id == resolved_id))
        if user and user.is_active:
            return user
    if not allow_demo_fallback:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    try:
        default_uuid = uuid.UUID(default_user_id)
    except ValueError:
        default_uuid = None
    fallback = await session.scalar(select(User).where(User.id == default_uuid)) if default_uuid else None
    if fallback and fallback.is_active:
        return fallback
    user = await session.scalar(select(User).where(User.referral_code == "BUYER1"))
    if user and user.is_active:
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")


async def list_catalog(
    session: AsyncSession,
    *,
    category: str | None,
    q: str | None,
    limit: int,
    offset: int,
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.variants)).where(Product.active.is_(True))
    if category and category != "all":
        stmt = stmt.where(Product.category == category)
    if q:
        needle = f"%{q.lower()}%"
        stmt = stmt.where(
            func.lower(Product.name).like(needle) | func.lower(Product.description).like(needle)
        )
    stmt = stmt.order_by(Product.created_at.desc()).limit(limit).offset(offset)
    rows = await session.scalars(stmt)
    return list(rows.unique().all())


async def get_product_by_slug(session: AsyncSession, slug: str) -> Product:
    product = await session.scalar(
        select(Product).options(selectinload(Product.variants)).where(Product.slug == slug)
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def get_session_by_id(session: AsyncSession, session_id: uuid.UUID) -> Session:
    gb_session = await session.scalar(
        select(Session)
        .options(selectinload(Session.participants).selectinload(Participation.variant))
        .where(Session.id == session_id)
    )
    if not gb_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return gb_session


async def get_family_sessions(session: AsyncSession, family_id: uuid.UUID) -> list[Session]:
    rows = await session.scalars(
        select(Session)
        .options(selectinload(Session.participants))
        .where(Session.family_id == family_id)
        .order_by(Session.created_at.desc())
    )
    return list(rows.all())


async def get_or_create_cart(session: AsyncSession, *, session_id: uuid.UUID | None, user_id: uuid.UUID | None) -> Cart:
    cart = await session.scalar(
        select(Cart)
        .options(selectinload(Cart.items))
        .where(Cart.session_id == session_id, Cart.user_id == user_id)
    )
    if cart:
        return cart
    cart = Cart(session_id=session_id, user_id=user_id)
    session.add(cart)
    await session.flush()
    return cart


def compute_cart_totals(cart: Cart) -> tuple[int, int, int]:
    total_units = 0
    total_original = 0
    total_discounted = 0
    for item in cart.items:
        total_units += item.quantity
        total_original += (item.original_price or item.unit_price or 0) * item.quantity
        total_discounted += (item.discounted_price or item.unit_price or 0) * item.quantity
    cart.total_units = total_units
    cart.total_original = total_original
    cart.total_discounted = total_discounted
    return total_units, total_original, total_discounted


async def upsert_cart_item(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    user_id: uuid.UUID | None,
    payload: CartItemUpsert,
) -> Cart:
    cart = await get_or_create_cart(db, session_id=session_id, user_id=user_id)
    product = await db.scalar(select(Product).where(Product.id == payload.product_id))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    variant = None
    if payload.variant_id:
        variant = await db.scalar(select(ProductVariant).where(ProductVariant.id == payload.variant_id))
    existing = next((item for item in cart.items if item.product_id == payload.product_id and item.variant_id == payload.variant_id), None)
    if existing:
        existing.quantity += payload.quantity
        existing.product_name = payload.product_name or product.name
        existing.variant_name = payload.variant_name
        existing.unit_price = payload.unit_price or product.base_price
        existing.original_price = payload.original_price or product.original_price or product.base_price
        existing.discounted_price = payload.discounted_price or product.price or product.base_price
        existing.image = payload.image or product.image
        existing.size = payload.size
        existing.color = payload.color
    else:
        cart.items.append(
            CartItem(
                cart_id=cart.id,
                product_id=payload.product_id,
                variant_id=payload.variant_id,
                product_name=payload.product_name or product.name,
                variant_name=payload.variant_name,
                quantity=payload.quantity,
                unit_price=payload.unit_price or product.base_price,
                original_price=payload.original_price or product.original_price or product.base_price,
                discounted_price=payload.discounted_price or product.price or product.base_price,
                image=payload.image or product.image,
                size=payload.size or (variant.size if variant else None),
                color=payload.color or (variant.color if variant else None),
            )
        )
    compute_cart_totals(cart)
    await db.flush()
    return cart


async def patch_cart_item(db: AsyncSession, *, session_id: uuid.UUID, item_id: uuid.UUID, quantity: int) -> Cart:
    cart = await db.scalar(
        select(Cart).options(selectinload(Cart.items)).where(Cart.session_id == session_id)
    )
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    item = next((row for row in cart.items if row.id == item_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    if quantity <= 0:
        cart.items.remove(item)
    else:
        item.quantity = quantity
    compute_cart_totals(cart)
    await db.flush()
    return cart


async def delete_cart_item(db: AsyncSession, *, session_id: uuid.UUID, item_id: uuid.UUID) -> Cart:
    return await patch_cart_item(db, session_id=session_id, item_id=item_id, quantity=0)


async def create_session(db: AsyncSession, *, creator: User, input: CreateSessionInput) -> Session:
    family_ref = input.family_id.strip()
    product = await db.scalar(
        select(Product)
        .options(selectinload(Product.variants))
        .where(or_(Product.slug == family_ref, cast(Product.id, String) == family_ref))
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    session = Session(
        family_id=product.id,
        family_slug=product.slug,
        title=input.title or product.name,
        description=input.description or product.description,
        created_by=creator.id,
        created_by_role=creator.role,
        access_type=input.access_type if input.access_type in {"public", "invite-link"} else AccessType.public.value,
        status=SessionStatus.active.value,
        target_slots=slot_count(product.discount_step, product.max_discount),
        current_slots=0,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=input.expires_in_hours),
        allowed_sizes=input.allowed_sizes or list(product.allowed_sizes or []),
        allowed_colors=input.allowed_colors or list(product.allowed_colors or []),
        base_price_snapshot=product.base_price,
        discount_step_snapshot=product.discount_step,
        max_discount_snapshot=product.max_discount,
        current_floor_price=product.base_price,
        last_settled_price=product.base_price,
        invite_code=f"{product.slug}-{uuid.uuid4().hex[:6].upper()}",
    )
    db.add(session)
    await db.flush()
    return session


async def join_session(db: AsyncSession, *, input: JoinSessionInput, current_user: User) -> tuple[Session, Participation, Order, WalletTransaction, int]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="join_session is wired in the API router")


async def join_session_by_id(db: AsyncSession, *, session_id: uuid.UUID, input: JoinSessionInput, current_user: User) -> dict:
    gb_session = await get_session_by_id(db, session_id)
    if gb_session.status != SessionStatus.active.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session is not active")
    if gb_session.expires_at < datetime.now(tz=UTC):
        gb_session.status = SessionStatus.expired.value
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session expired")
    if gb_session.current_slots >= gb_session.target_slots:
        gb_session.status = SessionStatus.completed.value
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session is already full")

    product = await db.scalar(select(Product).options(selectinload(Product.variants)).where(Product.id == gb_session.family_id))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    variant = next((item for item in product.variants if item.id == input.variant_id), None)
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    if not variant.is_allowed_in_gb:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Variant is not allowed in GB")
    if gb_session.allowed_sizes and variant.size not in gb_session.allowed_sizes:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Size is not allowed")
    if gb_session.allowed_colors and variant.color not in gb_session.allowed_colors:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Color is not allowed")
    if variant.stock <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Out of stock")
    pending_order = await db.scalar(
        select(Order).where(
            Order.user_id == current_user.id,
            Order.session_id == gb_session.id,
            Order.status == OrderStatus.created.value,
        )
    )
    if pending_order:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User has a pending order for this session")

    slot_number = gb_session.current_slots + 1
    price = calculate_slot_price(
        gb_session.base_price_snapshot,
        gb_session.discount_step_snapshot,
        gb_session.max_discount_snapshot,
        slot_number,
    )
    wallet_spend = max(0, min(input.wallet_spend, price))
    if wallet_spend > current_user.wallet_balance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient wallet balance")
    previous_floor = gb_session.last_settled_price
    refund_delta = max(0, previous_floor - price)

    participation = Participation(
        session_id=gb_session.id,
        user_id=current_user.id,
        user_name=current_user.name,
        variant_id=variant.id,
        size=variant.size,
        color=variant.color,
        slot_number=slot_number,
        price_paid=price,
        status=ParticipationStatus.paid.value,
    )
    order = Order(
        user_id=current_user.id,
        session_id=gb_session.id,
        family_id=product.id,
        seller_id=product.seller_id,
        category_slug=product.category_slug,
        family_name=product.name,
        variant_label=f"{variant.size} / {variant.color}",
        total_amount=price,
        wallet_deduction=wallet_spend,
        status=OrderStatus.created.value,
        participation_id=participation.id,
    )
    gb_session.participants.append(participation)
    gb_session.current_slots = slot_number
    gb_session.current_floor_price = price
    gb_session.last_settled_price = price
    if gb_session.current_slots >= gb_session.target_slots:
        gb_session.status = SessionStatus.completed.value
    variant.stock = max(0, variant.stock - 1)
    if wallet_spend:
        current_user.wallet_balance -= wallet_spend
        db.add(
            WalletTransaction(
                user_id=current_user.id,
                type=TransactionType.debit.value,
                amount=wallet_spend,
                source=TransactionSource.wallet_spend.value,
                description=f"Spent wallet funds for slot #{slot_number} in {product.name}",
                related_session_id=gb_session.id,
                related_order_id=order.id,
            )
        )
    db.add_all([participation, order])
    db.add(
        WalletTransaction(
            user_id=current_user.id,
            type=TransactionType.debit.value,
            amount=price - wallet_spend,
            source=TransactionSource.payment.value,
            description=f"Payment for slot #{slot_number} in {product.name}",
            related_session_id=gb_session.id,
            related_order_id=order.id,
        )
    )
    if refund_delta > 0:
        participants = await db.scalars(
            select(Participation).where(Participation.session_id == gb_session.id, Participation.slot_number < slot_number)
        )
        for participant in participants.all():
            participant_user = await db.scalar(select(User).where(User.id == participant.user_id))
            if participant_user:
                participant_user.wallet_balance += refund_delta
                db.add(
                    WalletTransaction(
                        user_id=participant_user.id,
                        type=TransactionType.credit.value,
                        amount=refund_delta,
                        source=TransactionSource.slot_refund.value,
                        description=f"Price drop refund after slot #{slot_number}",
                        related_session_id=gb_session.id,
                        related_order_id=order.id,
                    )
                )
    await db.flush()
    return {"session": gb_session, "participation": participation, "order": order, "refund_delta": refund_delta}


async def create_cart_order(
    db: AsyncSession,
    *,
    current_user: User,
    cart: Cart,
    wallet_deduction: int,
) -> Order:
    if not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")
    subtotal = sum((item.discounted_price or item.unit_price or 0) * item.quantity for item in cart.items)
    first_item = cart.items[0]
    order = Order(
        user_id=current_user.id,
        family_name=first_item.product_name or "Корзина SIDRAT",
        variant_label=", ".join(
            f"{item.product_name or 'Item'} × {item.quantity}" for item in cart.items[:3]
        ),
        total_amount=subtotal,
        wallet_deduction=min(max(wallet_deduction, 0), subtotal),
        status=OrderStatus.created.value,
        category_slug=None,
        seller_id=None,
    )
    db.add(order)
    if order.wallet_deduction > current_user.wallet_balance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient wallet balance")
    if order.wallet_deduction:
        current_user.wallet_balance = max(0, current_user.wallet_balance - order.wallet_deduction)
        db.add(
            WalletTransaction(
                user_id=current_user.id,
                type=TransactionType.debit.value,
                amount=order.wallet_deduction,
                source=TransactionSource.wallet_spend.value,
                description="Wallet deduction for cart checkout",
                related_order_id=order.id,
            )
        )
    await db.flush()
    return order


async def confirm_order(
    db: AsyncSession,
    *,
    order: Order,
    shipping_address: ShippingAddressInput,
) -> Order:
    order.shipping_address = shipping_address.model_dump()
    order.status = OrderStatus.confirmed.value
    await db.flush()
    return order


async def list_cart(db: AsyncSession, *, session_id: uuid.UUID | None, user_id: uuid.UUID | None) -> Cart:
    cart = await db.scalar(
        select(Cart).options(selectinload(Cart.items)).where(Cart.session_id == session_id, Cart.user_id == user_id)
    )
    if not cart:
        cart = Cart(session_id=session_id, user_id=user_id)
        db.add(cart)
        await db.flush()
    compute_cart_totals(cart)
    return cart


async def create_withdrawal(db: AsyncSession, *, current_user: User, amount: int) -> WithdrawalRequest:
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawal amount must be positive")
    if current_user.wallet_balance < amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient wallet balance")
    fee_amount = math.ceil(amount * 0.05)
    net_amount = amount - fee_amount
    current_user.wallet_balance -= amount
    withdrawal = WithdrawalRequest(
        user_id=current_user.id,
        amount=amount,
        fee_amount=fee_amount,
        net_amount=net_amount,
        status=WithdrawalStatus.pending.value,
    )
    db.add(withdrawal)
    db.add(
        WalletTransaction(
            user_id=current_user.id,
            type=TransactionType.debit.value,
            amount=amount,
            source=TransactionSource.withdrawal.value,
            description=f"Withdrawal request created, fee {fee_amount}",
        )
    )
    await db.flush()
    return withdrawal


async def get_seller_dashboard(db: AsyncSession, *, user: User) -> dict:
    product_stmt = select(Product).where(Product.seller_id == user.id)
    if user.role == Role.admin.value:
        product_stmt = select(Product)
    products = list((await db.scalars(product_stmt.options(selectinload(Product.variants)))).all())
    product_ids = [product.id for product in products]
    session_stmt = select(Session).where(Session.family_id.in_(product_ids))
    if user.role == Role.admin.value:
        session_stmt = select(Session)
    sessions = list((await db.scalars(session_stmt)).all())
    order_stmt = select(Order).where(Order.status != OrderStatus.cancelled.value)
    if user.role != Role.admin.value:
        order_stmt = order_stmt.where(Order.seller_id == user.id)
    orders = list((await db.scalars(order_stmt)).all())
    wallet_transactions = list((await db.scalars(select(WalletTransaction).where(WalletTransaction.user_id == user.id))).all())
    gross_revenue = sum(order.total_amount for order in orders if order.status in {OrderStatus.confirmed.value, OrderStatus.fulfilled.value})
    return {
        "summary": {
            "gross_revenue": gross_revenue,
            "net_revenue": gross_revenue,
            "order_count": len(orders),
            "buyout_count": len([order for order in orders if order.status in {OrderStatus.confirmed.value, OrderStatus.fulfilled.value}]),
            "conversion_rate": 0 if not sessions else sum(s.current_slots for s in sessions) / max(1, sum(s.target_slots for s in sessions)),
            "average_order_value": gross_revenue / max(1, len(orders)),
            "active_products": len([product for product in products if product.active]),
            "active_sessions": len([session for session in sessions if session.status == SessionStatus.active.value]),
            "payout_ready": max(0, gross_revenue - sum(tx.amount for tx in wallet_transactions if tx.type == TransactionType.debit.value)),
            "wallet_balance": user.wallet_balance,
            "refund_amount": 0,
        },
        "products": products,
        "sessions": sessions,
        "orders": orders,
        "wallet_transactions": wallet_transactions,
    }
