from __future__ import annotations

import uuid
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.domain.enums import SubscriptionStatus, TenantStatus, UserRole
from app.modules.auth.domain.models import Tenant, User
from app.modules.auth.security.passwords import hash_password
from app.modules.auth.service.access_mode import now_utc


def _create_user(
    db: Session,
    *,
    email: str,
    role: str,
    password: str,
    tenant_status: str = TenantStatus.active.value,
    subscription_status: str = SubscriptionStatus.trial.value,
    trial_ends_at_delta_days: int = 30,
    verified: bool = True,
) -> User:
    tenant = Tenant(
        id=uuid.uuid4(),
        status=tenant_status,
        subscription_status=subscription_status,
        trial_starts_at=now_utc() - timedelta(days=1),
        trial_ends_at=now_utc() + timedelta(days=trial_ends_at_delta_days),
    )
    db.add(tenant)

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        role=role,
        email=email,
        email_verified_at=now_utc() if verified else None,
        password_hash=hash_password(password),
        is_active=True,
        locale="es-ES",
        timezone="Europe/Madrid",
    )
    db.add(user)
    db.commit()
    return user


def test_register_verify_login_and_me_flow(client: TestClient) -> None:
    register_res = client.post(
        "/api/auth/register",
        json={"email": "worker1@example.com", "password": "12345678aA!"},
    )
    assert register_res.status_code == 200
    register_payload = register_res.json()
    assert register_payload["status"] == "ok"
    assert register_payload["dev_verify_token"]

    verify_res = client.post(
        "/api/auth/verify-email",
        json={"token": register_payload["dev_verify_token"]},
    )
    assert verify_res.status_code == 200
    assert verify_res.json() == {"status": "ok"}

    login_res = client.post(
        "/api/auth/login",
        json={"email": "worker1@example.com", "password": "12345678aA!"},
    )
    assert login_res.status_code == 200
    login_payload = login_res.json()
    assert login_payload["access_mode"] == "active"
    assert login_payload["token_type"] == "bearer"

    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert me_res.status_code == 200
    me_payload = me_res.json()
    assert me_payload["email"] == "worker1@example.com"
    assert me_payload["role"] == UserRole.worker.value
    assert me_payload["access_mode"] == "active"


def test_verify_email_with_invalid_token_returns_deterministic_error(client: TestClient) -> None:
    response = client.post("/api/auth/verify-email", json={"token": "invalid-token"})
    assert response.status_code == 400
    assert response.json() == {"detail": "invalid_token"}


def test_login_with_unknown_email_returns_invalid_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "missing@example.com", "password": "12345678aA!"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "invalid_credentials"}


def test_worker_login_requires_verified_email(client: TestClient) -> None:
    register_res = client.post(
        "/api/auth/register",
        json={"email": "worker2@example.com", "password": "12345678aA!"},
    )
    assert register_res.status_code == 200

    response = client.post(
        "/api/auth/login",
        json={"email": "worker2@example.com", "password": "12345678aA!"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "email_not_verified"}


def test_worker_login_returns_read_only_when_tenant_trial_expired(client: TestClient, db: Session) -> None:
    _create_user(
        db,
        email="worker3@example.com",
        role=UserRole.worker.value,
        password="12345678aA!",
        subscription_status=SubscriptionStatus.trial.value,
        trial_ends_at_delta_days=-1,
        verified=True,
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "worker3@example.com", "password": "12345678aA!"},
    )
    assert response.status_code == 200
    assert response.json()["access_mode"] == "read_only"


def test_client_login_is_blocked_when_tenant_is_expired(client: TestClient, db: Session) -> None:
    _create_user(
        db,
        email="client1@example.com",
        role=UserRole.client.value,
        password="12345678aA!",
        subscription_status=SubscriptionStatus.trial.value,
        trial_ends_at_delta_days=-1,
        verified=True,
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "client1@example.com", "password": "12345678aA!"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "tenant_inactive"}
