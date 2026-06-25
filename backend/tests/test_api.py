from __future__ import annotations

import re
import uuid

import pytest


BUYER_ID = "11111111-1111-1111-1111-111111111111"
SELLER_ID = "22222222-2222-2222-2222-222222222222"
AIRMAX_SESSION_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
AIRMAX_VARIANT_ID = "aaaa0000-0000-0000-0000-000000000002"
IPHONE_PRODUCT_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc"
IPHONE_VARIANT_ID = "cccc0000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_health_and_readiness(api_client):
    health = await api_client.get("/healthz")
    assert health.status_code == 200
    assert health.json() == {"ok": True}

    ready = await api_client.get("/readyz")
    assert ready.status_code == 200
    assert ready.json()["ok"] is True
    assert ready.json()["db"] is True


@pytest.mark.asyncio
async def test_identity_bridge_catalog_and_product_detail(api_client):
    me = await api_client.get("/api/v1/me", headers={"X-User-Id": "seller-demo"})
    assert me.status_code == 200
    assert me.json()["id"] == SELLER_ID
    assert me.json()["role"] == "seller"

    catalog = await api_client.get("/api/v1/catalog")
    assert catalog.status_code == 200
    slugs = {item["slug"] for item in catalog.json()}
    assert "nike-air-max-2024" in slugs
    assert "iphone-15-pro-max" in slugs

    product = await api_client.get("/api/v1/products/nike-air-max-2024")
    assert product.status_code == 200
    payload = product.json()
    assert payload["slug"] == "nike-air-max-2024"
    assert len(payload["variants"]) >= 2


@pytest.mark.asyncio
async def test_session_join_and_seller_dashboard(api_client):
    join = await api_client.post(
        f"/api/v1/sessions/{AIRMAX_SESSION_ID}/join",
        headers={"X-User-Id": "seller-demo"},
        json={
            "variantId": AIRMAX_VARIANT_ID,
            "walletSpend": 0,
        },
    )
    assert join.status_code == 200
    payload = join.json()
    assert payload["session"]["id"] == AIRMAX_SESSION_ID
    assert payload["participation"]["variantId"] == AIRMAX_VARIANT_ID
    assert payload["order"]["status"] == "created"
    assert payload["refundDelta"] >= 0

    dashboard = await api_client.get("/api/v1/seller/dashboard", headers={"X-User-Id": "seller-demo"})
    assert dashboard.status_code == 200
    summary = dashboard.json()["summary"]
    assert summary["wallet_balance"] == 300
    assert summary["active_products"] >= 4
    assert summary["active_sessions"] >= 1


@pytest.mark.asyncio
async def test_cart_checkout_confirm_and_withdrawal(api_client):
    add_item = await api_client.post(
        f"/api/v1/sessions/{AIRMAX_SESSION_ID}/cart/items",
        headers={"X-User-Id": "buyer-demo"},
        json={
            "productId": IPHONE_PRODUCT_ID,
            "variantId": IPHONE_VARIANT_ID,
            "quantity": 1,
            "productName": "iPhone 15 Pro Max",
            "variantName": "256 GB / Natural Titanium",
            "unitPrice": 119990,
            "originalPrice": 119990,
            "discountedPrice": 119990,
            "image": "/assets/products/iphone-15-pro-max/cover.svg",
            "size": "256 GB",
            "color": "Natural Titanium",
        },
    )
    assert add_item.status_code == 201
    cart = add_item.json()
    assert cart["totalUnits"] == 1
    assert cart["totalDiscounted"] == 119990

    order = await api_client.post(
        f"/api/v1/orders/cart?session_id={AIRMAX_SESSION_ID}&wallet_deduction=100",
        headers={"X-User-Id": "buyer-demo"},
    )
    assert order.status_code == 201
    order_payload = order.json()
    assert order_payload["walletDeduction"] == 100
    assert order_payload["status"] == "created"

    confirmed = await api_client.post(
        f"/api/v1/orders/{order_payload['id']}/confirm",
        headers={"X-User-Id": "buyer-demo"},
        json={
            "shippingAddress": {
                "fullName": "Demo Buyer",
                "phone": "+7 999 000-00-00",
                "address": "Test street 1",
                "city": "Moscow",
                "region": "Moscow",
                "postalCode": "101000",
                "country": "RU",
            }
        },
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "confirmed"

    withdrawal = await api_client.post(
        "/api/v1/withdrawals?amount=50",
        headers={"X-User-Id": "buyer-demo"},
    )
    assert withdrawal.status_code == 201
    assert withdrawal.json()["amount"] == 50

    withdrawals = await api_client.get("/api/v1/withdrawals", headers={"X-User-Id": "buyer-demo"})
    assert withdrawals.status_code == 200
    assert any(item["amount"] == 50 for item in withdrawals.json())


@pytest.mark.asyncio
async def test_registration_login_and_seller_approval(api_client, monkeypatch):
    sent_messages: list[str] = []

    def fake_send_email(recipient: str, subject: str, body: str) -> None:
        sent_messages.append(f"{recipient}\n{subject}\n{body}")

    monkeypatch.setattr("app.auth_service.send_email", fake_send_email)

    email = f"buyer-{uuid.uuid4().hex[:8]}@sidrat.local"
    password = "secure-pass-123"

    request_code = await api_client.post(
        "/api/v1/auth/register/request-code",
        json={
            "email": email,
            "name": "Test Buyer",
            "password": password,
        },
    )
    assert request_code.status_code == 200
    assert sent_messages
    code_match = re.search(r"(\d{6})", sent_messages[-1])
    assert code_match is not None

    verify = await api_client.post(
        "/api/v1/auth/register/verify",
        json={
            "email": email,
            "code": code_match.group(1),
        },
    )
    assert verify.status_code == 200
    verify_payload = verify.json()
    assert verify_payload["user"]["emailVerifiedAt"] is not None

    login = await api_client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login.status_code == 200
    login_payload = login.json()
    assert login_payload["user"]["email"] == email

    unauthorized_create = await api_client.post(
        "/api/v1/sessions",
        headers={"Authorization": f"Bearer {verify_payload['accessToken']}"},
        json={
            "familyId": "nike-air-max-2024",
            "accessType": "public",
            "expiresInHours": 24,
            "allowedSizes": [],
            "allowedColors": [],
            "title": "Should fail",
            "description": "No seller access",
        },
    )
    assert unauthorized_create.status_code == 403

    seller_login = await api_client.post(
        "/api/v1/auth/login",
        json={
            "email": "seller@sidrat.local",
            "password": "seller-demo-password",
        },
    )
    assert seller_login.status_code == 200
    seller_token = seller_login.json()["accessToken"]

    create_session = await api_client.post(
        "/api/v1/sessions",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={
            "familyId": "nike-air-max-2024",
            "accessType": "public",
            "expiresInHours": 24,
            "allowedSizes": [],
            "allowedColors": [],
            "title": "Seller session",
            "description": "Approved seller access",
        },
    )
    assert create_session.status_code == 201

    seller_application = await api_client.post(
        "/api/v1/seller-applications",
        json={
            "email": email,
            "name": "Test Buyer",
            "companyName": "Test Brand",
            "phone": "+7 999 000-00-00",
            "message": "Please promote me",
        },
    )
    assert seller_application.status_code == 201
    application_id = seller_application.json()["id"]

    approve = await api_client.post(
        f"/api/v1/admin/seller-applications/{application_id}/approve",
        headers={"X-User-Id": "admin-demo"},
    )
    assert approve.status_code == 200
    assert approve.json()["status"] == "approved"

    promoted_me = await api_client.get("/api/v1/me", headers={"Authorization": f"Bearer {verify_payload['accessToken']}"})
    assert promoted_me.status_code == 200
    assert promoted_me.json()["role"] == "seller"

