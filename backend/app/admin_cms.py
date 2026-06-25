from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.db import get_session
from app.dependencies import admin_user
from app.models import (
    CmsBlock,
    CmsPage,
    ContentRevision,
    ContentStatus,
    HeroSlide,
    MediaAsset,
    Product,
    ProductDisplayConfig,
    User,
)
from app.schemas import (
    AdminUserRead,
    AdminUserUpsert,
    CmsBlockRead,
    CmsBlockUpsert,
    CmsPageRead,
    CmsPageUpsert,
    ContentRevisionRead,
    HeroSlideRead,
    HeroSlideUpsert,
    MediaAssetRead,
    MediaAssetUpsert,
    ProductDisplayRead,
    ProductDisplayUpsert,
)
from app.security import hash_password

router = APIRouter(prefix="/api/v1")


def _utc_now() -> datetime:
    return datetime.now(tz=UTC)


def _snapshot(model: Any, *, excluded: set[str] | None = None) -> dict[str, Any]:
    excluded = excluded or set()
    data: dict[str, Any] = {}
    for key in inspect(model).mapper.columns.keys():
        if key in excluded:
            continue
        value = getattr(model, key, None)
        if key.startswith("_") or key in excluded:
            continue
        if isinstance(value, (datetime, UUID)):
            data[key] = value.isoformat()
        else:
            data[key] = value
    return data


def _restore_value(column: Any, value: Any) -> Any:
    if value is None:
        return None
    if isinstance(column.type, PGUUID) and isinstance(value, str):
        return UUID(value)
    if column.type.__class__.__name__ == "DateTime" and isinstance(value, str):
        return datetime.fromisoformat(value)
    return value


def _apply_payload(model: Any, payload: dict[str, Any]) -> None:
    mapper = inspect(model).mapper
    for column in mapper.columns:
        if column.key in payload:
            setattr(model, column.key, _restore_value(column, payload[column.key]))


async def _restore_by_entity_type(db: AsyncSession, revision: ContentRevision, admin: User) -> None:
    payload = dict(revision.payload)
    entity_type = revision.entity_type

    if entity_type == "page":
        page = await db.scalar(select(CmsPage).where(CmsPage.id == UUID(payload["id"])))
        if not page:
            page = CmsPage()
            db.add(page)
        _apply_payload(page, payload)
        await db.flush()
        return

    if entity_type == "block":
        block = await db.scalar(select(CmsBlock).where(CmsBlock.id == UUID(payload["id"])))
        if not block:
            block = CmsBlock()
            db.add(block)
        _apply_payload(block, payload)
        await db.flush()
        return

    if entity_type == "media":
        asset = await db.scalar(select(MediaAsset).where(MediaAsset.id == UUID(payload["id"])))
        if not asset:
            asset = MediaAsset()
            db.add(asset)
        _apply_payload(asset, payload)
        await db.flush()
        return

    if entity_type == "hero_slide":
        slide = await db.scalar(select(HeroSlide).where(HeroSlide.id == UUID(payload["id"])))
        if not slide:
            slide = HeroSlide()
            db.add(slide)
        _apply_payload(slide, payload)
        await db.flush()
        return

    if entity_type == "product_display":
        config = await db.scalar(select(ProductDisplayConfig).where(ProductDisplayConfig.id == UUID(payload["id"])))
        if not config:
            config = ProductDisplayConfig()
            db.add(config)
        _apply_payload(config, payload)
        await db.flush()
        return

    if entity_type == "user":
        user = await db.scalar(select(User).where(User.id == UUID(payload["id"])))
        if not user:
            user = User()
            db.add(user)
        _apply_payload(user, payload)
        await db.flush()
        return

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported revision type")


async def _record_revision(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: str,
    action: str,
    payload: dict[str, Any],
    admin: User | None,
    note: str | None = None,
) -> None:
    db.add(
        ContentRevision(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload=payload,
            created_by=admin.id if admin else None,
            note=note,
        )
    )


def _media_read(asset: MediaAsset) -> MediaAssetRead:
    return MediaAssetRead.model_validate(asset)


def _page_read(page: CmsPage) -> CmsPageRead:
    return CmsPageRead.model_validate(page)


def _block_read(block: CmsBlock) -> CmsBlockRead:
    return CmsBlockRead.model_validate(block)


def _hero_read(slide: HeroSlide) -> HeroSlideRead:
    return HeroSlideRead.model_validate(slide)


def _product_display_read(config: ProductDisplayConfig) -> ProductDisplayRead:
    return ProductDisplayRead.model_validate(config)


def _user_read(user: User) -> AdminUserRead:
    return AdminUserRead.model_validate(user)


async def seed_cms_defaults(db: AsyncSession) -> None:
    existing_pages = await db.scalar(select(CmsPage.id).limit(1))
    if existing_pages:
        return

    media_items = [
        MediaAsset(
            key="hero-slide-1",
            label="Hero slide 1",
            alt_text="Покупайте вместе",
            kind="hero",
            source_url="/assets/hero/slide-1.svg",
            usage="homepage hero",
            tags=["hero", "homepage"],
            asset_meta={"source": "seed"},
            status=ContentStatus.published.value,
        ),
        MediaAsset(
            key="hero-slide-2",
            label="Hero slide 2",
            alt_text="Активные GB-сессии",
            kind="hero",
            source_url="/assets/hero/slide-2.svg",
            usage="homepage hero",
            tags=["hero", "homepage"],
            asset_meta={"source": "seed"},
            status=ContentStatus.published.value,
        ),
        MediaAsset(
            key="hero-slide-3",
            label="Hero slide 3",
            alt_text="Создавайте собственную сессию",
            kind="hero",
            source_url="/assets/hero/slide-3.svg",
            usage="homepage hero",
            tags=["hero", "homepage"],
            asset_meta={"source": "seed"},
            status=ContentStatus.published.value,
        ),
        MediaAsset(
            key="hero-slide-4",
            label="Hero slide 4",
            alt_text="Возвращайте разницу в wallet",
            kind="hero",
            source_url="/assets/hero/slide-4.svg",
            usage="homepage hero",
            tags=["hero", "homepage"],
            asset_meta={"source": "seed"},
            status=ContentStatus.published.value,
        ),
        MediaAsset(
            key="product-nike-air-max-cover",
            label="Nike Air Max cover",
            alt_text="Nike Air Max 2024",
            kind="product",
            source_url="/assets/products/nike-air-max-2024/cover.svg",
            usage="product card",
            tags=["product", "footwear"],
            asset_meta={"productSlug": "nike-air-max-2024"},
            status=ContentStatus.published.value,
        ),
    ]
    for item in media_items:
        db.add(item)
        await db.flush()

    pages = [
        CmsPage(
            slug="home",
            title="Home",
            template_key="landing",
            seo_title="Sidrat marketplace",
            seo_description="Групповые покупки и GB-сессии",
            status=ContentStatus.published.value,
            published_at=_utc_now(),
            settings={"layout": "home"},
        ),
        CmsPage(
            slug="catalog",
            title="Catalog",
            template_key="listing",
            seo_title="Каталог Sidrat",
            seo_description="Товары и GB-сессии",
            status=ContentStatus.published.value,
            published_at=_utc_now(),
            settings={"layout": "catalog"},
        ),
        CmsPage(
            slug="product-detail",
            title="Product detail",
            template_key="product",
            seo_title="Карточка товара Sidrat",
            seo_description="Динамическая карточка товара",
            status=ContentStatus.published.value,
            published_at=_utc_now(),
            settings={"layout": "product"},
        ),
    ]
    for page in pages:
        db.add(page)
        await db.flush()

    blocks = [
        CmsBlock(
            page_id=pages[0].id,
            block_type="feature_list",
            position=1,
            visible=True,
            title="Покупайте вместе.",
            subtitle="MVP маркетплейса для групповых покупок",
            body="SIDRAT строится вокруг GB-сессий на товарные семейства.",
            cta_text="Смотреть каталог",
            cta_link="/catalog",
            props={"items": ["Групповые покупки 2.0", "Пошаговая скидка", "Wallet-логика"]},
            status=ContentStatus.published.value,
            published_at=_utc_now(),
        ),
        CmsBlock(
            page_id=pages[0].id,
            block_type="cta",
            position=2,
            visible=True,
            title="Хочешь запускать GB-сессии?",
            body="Подай заявку продавца, и админ вручную подтвердит твой аккаунт.",
            cta_text="Подать заявку продавца",
            cta_link="/seller-application",
            props={"tone": "seller"},
            status=ContentStatus.published.value,
            published_at=_utc_now(),
        ),
    ]
    for block in blocks:
        db.add(block)
        await db.flush()

    slides = [
        HeroSlide(
            title="Покупайте вместе.",
            subtitle="MVP маркетплейса для групповых покупок",
            description="SIDRAT строится вокруг GB-сессий на товарные семейства.",
            cta_text="Смотреть каталог",
            cta_link="/catalog",
            media_asset_id=media_items[0].id,
            position=1,
            visible=True,
            status=ContentStatus.published.value,
            props={"tone": "primary"},
        ),
        HeroSlide(
            title="Активные GB-сессии.",
            subtitle="Смотрите, где уже живое движение",
            description="Открывайте текущие сессии, смотрите занятые слоты и следующую цену.",
            cta_text="Активные сессии",
            cta_link="/sessions",
            media_asset_id=media_items[1].id,
            position=2,
            visible=True,
            status=ContentStatus.published.value,
            props={"tone": "secondary"},
        ),
        HeroSlide(
            title="Создавайте собственную сессию.",
            subtitle="Для продавца или куратора семейства",
            description="Настраивайте размеры, цвета и срок жизни сессии.",
            cta_text="Создать сессию",
            cta_link="/catalog",
            media_asset_id=media_items[2].id,
            position=3,
            visible=True,
            status=ContentStatus.published.value,
            props={"tone": "seller"},
        ),
        HeroSlide(
            title="Возвращайте разницу в wallet.",
            subtitle="Когда слоты закрываются, скидка работает дальше",
            description="Каждый следующий слот сдвигает цену вниз, а разница возвращается на баланс.",
            cta_text="Открыть кошелёк",
            cta_link="/wallet",
            media_asset_id=media_items[3].id,
            position=4,
            visible=True,
            status=ContentStatus.published.value,
            props={"tone": "wallet"},
        ),
    ]
    for slide in slides:
        db.add(slide)
        await db.flush()

    products = await db.scalars(select(Product))
    for product in products.all():
        config = ProductDisplayConfig(
            product_id=product.id,
            template_key=product.variant_strategy or "standard",
            headline=product.name,
            subtitle=product.category,
            badge_text="GB-ready" if product.supports_gb2 else None,
            cta_text="Создать GB-сессию",
            cta_link=f"/session/create/{product.slug}",
            hero_media_asset_id=media_items[4].id if product.slug == "nike-air-max-2024" else None,
            gallery_media_asset_ids=list(product.images or []),
            specs=product.specs or {},
            sections=[
                {"type": "description", "title": "Описание", "body": product.description},
                {"type": "specs", "title": "Характеристики", "body": None},
            ],
            status=ContentStatus.published.value,
            props={"seeded": True},
        )
        db.add(config)
        await db.flush()

    await db.commit()


def _public_page(page: CmsPage) -> dict[str, Any]:
    return {
        **_page_read(page).model_dump(by_alias=True),
        "blocks": [
            _block_read(block).model_dump(by_alias=True)
            for block in page.blocks
            if block.visible and block.status == ContentStatus.published.value
        ],
    }


@router.get("/content/hero-slides", response_model=list[HeroSlideRead])
async def public_hero_slides(db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(
        select(HeroSlide)
        .options(selectinload(HeroSlide.media_asset))
        .where(HeroSlide.visible.is_(True), HeroSlide.status == ContentStatus.published.value)
        .order_by(HeroSlide.position.asc(), HeroSlide.created_at.asc())
    )
    result = []
    for item in rows.all():
        payload = _hero_read(item).model_dump(by_alias=True)
        payload["image"] = item.media_asset.source_url if item.media_asset else None
        result.append(payload)
    return result


@router.get("/content/pages/{slug}")
async def public_page(slug: str, db: AsyncSession = Depends(get_session)):
    page = await db.scalar(
        select(CmsPage)
        .options(selectinload(CmsPage.blocks).selectinload(CmsBlock.media_asset))
        .where(CmsPage.slug == slug, CmsPage.status == ContentStatus.published.value)
    )
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return _public_page(page)


@router.get("/content/product-display/{slug}")
async def public_product_display(slug: str, db: AsyncSession = Depends(get_session)):
    product = await db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    config = await db.scalar(
        select(ProductDisplayConfig)
        .options(selectinload(ProductDisplayConfig.hero_media_asset))
        .where(ProductDisplayConfig.product_id == product.id)
    )
    if config is None:
        return {
            "productId": str(product.id),
            "templateKey": product.variant_strategy or "standard",
            "headline": product.name,
            "subtitle": product.category,
            "badgeText": "GB-ready" if product.supports_gb2 else None,
            "ctaText": "Создать GB-сессию",
            "ctaLink": f"/session/create/{product.slug}",
            "heroMediaAssetId": None,
            "heroImageUrl": product.image,
            "galleryMediaAssetIds": list(product.images or []),
            "galleryUrls": list(product.images or []),
            "specs": product.specs or {},
            "sections": [
                {"type": "description", "title": "Описание", "body": product.description},
                {"type": "specs", "title": "Характеристики", "body": None},
            ],
            "status": ContentStatus.published.value,
            "props": {"fallback": True},
        }
    payload = _product_display_read(config).model_dump(by_alias=True)
    payload["heroImageUrl"] = config.hero_media_asset.source_url if config.hero_media_asset else None
    payload["galleryUrls"] = list(config.gallery_media_asset_ids or [])
    return payload


@router.get("/admin/content/media", response_model=list[MediaAssetRead])
async def admin_list_media(admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(MediaAsset).order_by(MediaAsset.created_at.desc()))
    return [_media_read(item) for item in rows.all()]


@router.post("/admin/content/media", response_model=MediaAssetRead, status_code=status.HTTP_201_CREATED)
async def admin_create_media(
    payload: MediaAssetUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    asset = await db.scalar(select(MediaAsset).where(MediaAsset.key == payload.key))
    if asset:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Media key already exists")
    asset = MediaAsset(**payload.model_dump())
    db.add(asset)
    await db.flush()
    await _record_revision(db, entity_type="media", entity_id=str(asset.id), action="create", payload=_snapshot(asset), admin=admin)
    await db.commit()
    await db.refresh(asset)
    return _media_read(asset)


@router.patch("/admin/content/media/{asset_id}", response_model=MediaAssetRead)
async def admin_update_media(
    asset_id: UUID,
    payload: MediaAssetUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    asset = await db.scalar(select(MediaAsset).where(MediaAsset.id == asset_id))
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    await _record_revision(db, entity_type="media", entity_id=str(asset.id), action="update", payload=_snapshot(asset), admin=admin)
    for key, value in payload.model_dump().items():
        setattr(asset, key, value)
    await db.flush()
    await db.commit()
    return _media_read(asset)


@router.delete("/admin/content/media/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_media(
    asset_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    asset = await db.scalar(select(MediaAsset).where(MediaAsset.id == asset_id))
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    await _record_revision(db, entity_type="media", entity_id=str(asset.id), action="delete", payload=_snapshot(asset), admin=admin)
    await db.delete(asset)
    await db.commit()


@router.get("/admin/content/hero-slides", response_model=list[HeroSlideRead])
async def admin_list_hero_slides(admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(
        select(HeroSlide).options(selectinload(HeroSlide.media_asset)).order_by(HeroSlide.position.asc(), HeroSlide.created_at.asc())
    )
    result = []
    for item in rows.all():
        payload = _hero_read(item).model_dump(by_alias=True)
        payload["image"] = item.media_asset.source_url if item.media_asset else None
        result.append(payload)
    return result


@router.post("/admin/content/hero-slides", response_model=HeroSlideRead, status_code=status.HTTP_201_CREATED)
async def admin_create_hero_slide(
    payload: HeroSlideUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    slide = HeroSlide(**payload.model_dump())
    db.add(slide)
    await db.flush()
    await _record_revision(db, entity_type="hero_slide", entity_id=str(slide.id), action="create", payload=_snapshot(slide), admin=admin)
    await db.commit()
    return _hero_read(slide)


@router.patch("/admin/content/hero-slides/{slide_id}", response_model=HeroSlideRead)
async def admin_update_hero_slide(
    slide_id: UUID,
    payload: HeroSlideUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    slide = await db.scalar(select(HeroSlide).where(HeroSlide.id == slide_id))
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hero slide not found")
    await _record_revision(db, entity_type="hero_slide", entity_id=str(slide.id), action="update", payload=_snapshot(slide), admin=admin)
    for key, value in payload.model_dump().items():
        setattr(slide, key, value)
    await db.flush()
    await db.commit()
    return _hero_read(slide)


@router.delete("/admin/content/hero-slides/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_hero_slide(
    slide_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    slide = await db.scalar(select(HeroSlide).where(HeroSlide.id == slide_id))
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hero slide not found")
    await _record_revision(db, entity_type="hero_slide", entity_id=str(slide.id), action="delete", payload=_snapshot(slide), admin=admin)
    await db.delete(slide)
    await db.commit()


@router.get("/admin/content/pages", response_model=list[CmsPageRead])
async def admin_list_pages(admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(
        select(CmsPage).options(selectinload(CmsPage.blocks).selectinload(CmsBlock.media_asset)).order_by(CmsPage.created_at.desc())
    )
    return [_page_read(page) for page in rows.all()]


@router.post("/admin/content/pages", response_model=CmsPageRead, status_code=status.HTTP_201_CREATED)
async def admin_create_page(
    payload: CmsPageUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    existing = await db.scalar(select(CmsPage).where(CmsPage.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Page slug already exists")
    page = CmsPage(**payload.model_dump())
    if page.status == ContentStatus.published.value:
        page.published_at = _utc_now()
        page.published_by = admin.id
    db.add(page)
    await db.flush()
    await _record_revision(db, entity_type="page", entity_id=str(page.id), action="create", payload=_snapshot(page), admin=admin)
    await db.commit()
    await db.refresh(page)
    return _page_read(page)


@router.patch("/admin/content/pages/{page_id}", response_model=CmsPageRead)
async def admin_update_page(
    page_id: UUID,
    payload: CmsPageUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    page = await db.scalar(
        select(CmsPage).options(selectinload(CmsPage.blocks).selectinload(CmsBlock.media_asset)).where(CmsPage.id == page_id)
    )
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    await _record_revision(db, entity_type="page", entity_id=str(page.id), action="update", payload=_snapshot(page), admin=admin)
    for key, value in payload.model_dump().items():
        setattr(page, key, value)
    if page.status == ContentStatus.published.value and page.published_at is None:
        page.published_at = _utc_now()
        page.published_by = admin.id
    await db.flush()
    await db.commit()
    return _page_read(page)


@router.post("/admin/content/pages/{page_id}/publish", response_model=CmsPageRead)
async def admin_publish_page(
    page_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    page = await db.scalar(select(CmsPage).where(CmsPage.id == page_id))
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    await _record_revision(db, entity_type="page", entity_id=str(page.id), action="publish", payload=_snapshot(page), admin=admin)
    page.status = ContentStatus.published.value
    page.published_at = _utc_now()
    page.published_by = admin.id
    await db.flush()
    await db.commit()
    return _page_read(page)


@router.delete("/admin/content/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_page(
    page_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    page = await db.scalar(select(CmsPage).where(CmsPage.id == page_id))
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    await _record_revision(db, entity_type="page", entity_id=str(page.id), action="delete", payload=_snapshot(page), admin=admin)
    await db.delete(page)
    await db.commit()


@router.get("/admin/content/pages/{page_id}/blocks", response_model=list[CmsBlockRead])
async def admin_list_blocks(page_id: UUID, admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(CmsBlock).where(CmsBlock.page_id == page_id).order_by(CmsBlock.position.asc()))
    return [_block_read(block) for block in rows.all()]


@router.post("/admin/content/pages/{page_id}/blocks", response_model=CmsBlockRead, status_code=status.HTTP_201_CREATED)
async def admin_create_block(
    page_id: UUID,
    payload: CmsBlockUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    page = await db.scalar(select(CmsPage).where(CmsPage.id == page_id))
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    block = CmsBlock(page_id=page.id, **payload.model_dump())
    if block.status == ContentStatus.published.value:
        block.published_at = _utc_now()
        block.published_by = admin.id
    db.add(block)
    await db.flush()
    await _record_revision(db, entity_type="block", entity_id=str(block.id), action="create", payload=_snapshot(block), admin=admin)
    await db.commit()
    return _block_read(block)


@router.patch("/admin/content/blocks/{block_id}", response_model=CmsBlockRead)
async def admin_update_block(
    block_id: UUID,
    payload: CmsBlockUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    block = await db.scalar(select(CmsBlock).where(CmsBlock.id == block_id))
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    await _record_revision(db, entity_type="block", entity_id=str(block.id), action="update", payload=_snapshot(block), admin=admin)
    for key, value in payload.model_dump().items():
        setattr(block, key, value)
    if block.status == ContentStatus.published.value and block.published_at is None:
        block.published_at = _utc_now()
        block.published_by = admin.id
    await db.flush()
    await db.commit()
    return _block_read(block)


@router.delete("/admin/content/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_block(
    block_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    block = await db.scalar(select(CmsBlock).where(CmsBlock.id == block_id))
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    await _record_revision(db, entity_type="block", entity_id=str(block.id), action="delete", payload=_snapshot(block), admin=admin)
    await db.delete(block)
    await db.commit()


@router.get("/admin/content/product-display", response_model=list[ProductDisplayRead])
async def admin_list_product_display(admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(ProductDisplayConfig).order_by(ProductDisplayConfig.created_at.desc()))
    return [_product_display_read(item) for item in rows.all()]


@router.get("/admin/content/product-display/{slug}", response_model=ProductDisplayRead)
async def admin_get_product_display(slug: str, admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    product = await db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    config = await db.scalar(select(ProductDisplayConfig).where(ProductDisplayConfig.product_id == product.id))
    if not config:
        return {
            "id": product.id,
            "productId": product.id,
            "templateKey": product.variant_strategy or "standard",
            "headline": product.name,
            "subtitle": product.category,
            "ctaText": "Создать GB-сессию",
            "ctaLink": f"/session/create/{product.slug}",
            "specs": product.specs or {},
            "sections": [],
            "status": ContentStatus.draft.value,
            "createdAt": product.created_at,
            "updatedAt": product.updated_at,
            "heroImageUrl": product.image,
            "galleryUrls": list(product.images or []),
        }
    payload = _product_display_read(config).model_dump(by_alias=True)
    payload["heroImageUrl"] = config.hero_media_asset.source_url if config.hero_media_asset else None
    payload["galleryUrls"] = list(config.gallery_media_asset_ids or [])
    return payload


@router.put("/admin/content/product-display/{slug}", response_model=ProductDisplayRead)
async def admin_upsert_product_display(
    slug: str,
    payload: ProductDisplayUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    product = await db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    config = await db.scalar(select(ProductDisplayConfig).where(ProductDisplayConfig.product_id == product.id))
    action = "update" if config else "create"
    if config:
        await _record_revision(db, entity_type="product_display", entity_id=str(config.id), action=action, payload=_snapshot(config), admin=admin)
        for key, value in payload.model_dump().items():
            setattr(config, key, value)
    else:
        config = ProductDisplayConfig(product_id=product.id, **payload.model_dump())
        db.add(config)
    if config.status == ContentStatus.published.value:
        config.published_at = _utc_now()
        config.published_by = admin.id
    await db.flush()
    await db.commit()
    payload = _product_display_read(config).model_dump(by_alias=True)
    payload["heroImageUrl"] = config.hero_media_asset.source_url if config.hero_media_asset else None
    payload["galleryUrls"] = list(config.gallery_media_asset_ids or [])
    return payload


@router.get("/admin/content/users", response_model=list[AdminUserRead])
async def admin_list_users(admin: User = Depends(admin_user), db: AsyncSession = Depends(get_session)):
    rows = await db.scalars(select(User).order_by(User.created_at.desc()))
    return [_user_read(item) for item in rows.all()]


@router.post("/admin/content/users", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    payload: AdminUserUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    existing = await db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
    password = payload.password or f"temp-{secrets.token_urlsafe(8)}"
    user = User(
        email=payload.email.lower().strip(),
        name=payload.name.strip(),
        role=payload.role,
        password_hash=hash_password(password),
        email_verified_at=_utc_now(),
        wallet_balance=payload.wallet_balance,
        referral_code=payload.referral_code or f"ADMIN{secrets.token_hex(2).upper()}",
        phone=payload.phone,
        full_name=payload.full_name or payload.name,
        is_active=payload.is_active,
    )
    db.add(user)
    await db.flush()
    await _record_revision(db, entity_type="user", entity_id=str(user.id), action="create", payload=_snapshot(user), admin=admin, note=password)
    await db.commit()
    return _user_read(user)


@router.patch("/admin/content/users/{user_id}", response_model=AdminUserRead)
async def admin_update_user(
    user_id: UUID,
    payload: AdminUserUpsert,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await _record_revision(db, entity_type="user", entity_id=str(user.id), action="update", payload=_snapshot(user), admin=admin)
    user.email = payload.email.lower().strip()
    user.name = payload.name.strip()
    user.role = payload.role
    user.wallet_balance = payload.wallet_balance
    user.phone = payload.phone
    user.full_name = payload.full_name or payload.name
    user.is_active = payload.is_active
    if payload.referral_code:
        user.referral_code = payload.referral_code
    if payload.password:
        user.password_hash = hash_password(payload.password)
    await db.flush()
    await db.commit()
    return _user_read(user)


@router.delete("/admin/content/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_user(
    user_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete current admin")
    await _record_revision(db, entity_type="user", entity_id=str(user.id), action="delete", payload=_snapshot(user), admin=admin)
    user.is_active = False
    await db.flush()
    await db.commit()


@router.get("/admin/content/revisions", response_model=list[ContentRevisionRead])
async def admin_list_revisions(
    entity_type: str | None = None,
    entity_id: str | None = None,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    stmt = select(ContentRevision).order_by(ContentRevision.created_at.desc())
    if entity_type:
        stmt = stmt.where(ContentRevision.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(ContentRevision.entity_id == entity_id)
    rows = await db.scalars(stmt)
    return [ContentRevisionRead.model_validate(item) for item in rows.all()]


@router.post("/admin/content/revisions/{revision_id}/rollback")
async def admin_rollback_revision(
    revision_id: UUID,
    admin: User = Depends(admin_user),
    db: AsyncSession = Depends(get_session),
):
    revision = await db.scalar(select(ContentRevision).where(ContentRevision.id == revision_id))
    if not revision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found")
    await _restore_by_entity_type(db, revision, admin)
    await _record_revision(
        db,
        entity_type=revision.entity_type,
        entity_id=revision.entity_id,
        action="rollback",
        payload=revision.payload,
        admin=admin,
        note=f"Rolled back revision {revision_id}",
    )
    await db.commit()
    return {"ok": True}


