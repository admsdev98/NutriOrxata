from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.auth.schemas import LoginIn, LoginOut, MeOut, RegisterWorkerIn, RegisterWorkerOut, VerifyEmailIn
from app.auth.security import create_access_token, hash_password, verify_password
from app.auth.sendgrid_client import send_email
from app.auth.tokens import new_token_urlsafe, token_hash_bytes
from app.deps import CurrentUser, DbSession
from app.models import EmailVerificationToken, SubscriptionStatus, Tenant, TenantStatus, User, UserRole
from app.settings import settings


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _tenant_access_mode(tenant: Tenant) -> str:
    if tenant.status != TenantStatus.active.value:
        return "blocked"

    if tenant.subscription_status == SubscriptionStatus.active.value:
        return "active"

    if tenant.trial_ends_at and _now() >= tenant.trial_ends_at:
        return "expired"

    return "trial"


@router.post("/register", response_model=RegisterWorkerOut)
def register_worker(payload: RegisterWorkerIn, session: DbSession) -> RegisterWorkerOut:
    email = payload.email.strip().lower()
    if session.execute(select(User).where(User.email == email, User.role == UserRole.worker.value)).first() is not None:
        raise HTTPException(status_code=409, detail="email_in_use")

    tenant = Tenant(id=uuid.uuid4(), status=TenantStatus.active.value, subscription_status=SubscriptionStatus.trial.value)
    session.add(tenant)

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        role=UserRole.worker.value,
        email=email,
        password_hash=hash_password(payload.password),
        is_active=True,
        locale="es-ES",
        timezone="Europe/Madrid",
    )
    session.add(user)

    # Ensure tenant + user are persisted before token insert.
    session.flush()

    raw_token = new_token_urlsafe()
    token = EmailVerificationToken(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        user_id=user.id,
        token_hash=token_hash_bytes(raw_token),
        expires_at=_now() + timedelta(hours=48),
    )
    session.add(token)
    session.commit()

    verify_url = f"{settings.public_api_base_url}/auth/verify-email?token={raw_token}"
    send_email(
        to_email=email,
        subject="Verifica tu correo",
        html=f"<p>Confirma tu correo para acceder:</p><p><a href=\"{verify_url}\">{verify_url}</a></p>",
    )

    dev_token = raw_token if settings.api_environment == "development" else None
    return RegisterWorkerOut(status="ok", dev_verify_token=dev_token)


@router.post("/verify-email")
def verify_email(payload: VerifyEmailIn, session: DbSession) -> dict[str, str]:
    token_hash = token_hash_bytes(payload.token)
    row = session.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.consumed_at.is_(None),
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=400, detail="invalid_token")
    if _now() > row.expires_at:
        raise HTTPException(status_code=400, detail="token_expired")

    user = session.execute(select(User).where(User.id == row.user_id)).scalar_one()
    if user.email_verified_at is None:
        user.email_verified_at = _now()

    tenant = session.execute(select(Tenant).where(Tenant.id == row.tenant_id)).scalar_one()
    if tenant.trial_starts_at is None:
        tenant.trial_starts_at = _now()
        tenant.trial_ends_at = _now() + timedelta(days=30)
        tenant.subscription_status = SubscriptionStatus.trial.value

    row.consumed_at = _now()
    session.commit()
    return {"status": "ok"}


@router.get("/verify-email")
def verify_email_link(session: DbSession, token: str = Query(...)) -> dict[str, str]:
    # Allow link-based verification from email clients.
    # NOTE: FastAPI injects DbSession via the annotation on other endpoints.
    # Here we keep the explicit parameter for the same injection behavior.
    return verify_email(VerifyEmailIn(token=token), session)


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, session: DbSession) -> LoginOut:
    email = payload.email.strip().lower()
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="invalid_credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="user_inactive")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")

    tenant = session.execute(select(Tenant).where(Tenant.id == user.tenant_id)).scalar_one()
    mode = _tenant_access_mode(tenant)

    if user.role == UserRole.worker.value:
        if user.email_verified_at is None:
            raise HTTPException(status_code=403, detail="email_not_verified")
        if mode == "blocked":
            raise HTTPException(status_code=403, detail="tenant_blocked")
        access_mode = "read_only" if mode == "expired" else "active"
    else:
        if mode in ("expired", "blocked"):
            raise HTTPException(status_code=403, detail="tenant_inactive")
        access_mode = "active"

    token = create_access_token(
        sub=str(user.id),
        tenant_id=str(user.tenant_id),
        role=str(user.role),
        access_mode=access_mode,
        minutes=60 * 24 * 7,
    )

    return LoginOut(access_token=token.token, access_mode=access_mode)


@router.get("/me", response_model=MeOut)
def me(user: CurrentUser, session: DbSession) -> MeOut:
    tenant = session.execute(select(Tenant).where(Tenant.id == user.tenant_id)).scalar_one()
    mode = _tenant_access_mode(tenant)
    access_mode = "active"
    if user.role == UserRole.worker.value and mode == "expired":
        access_mode = "read_only"

    return MeOut(
        id=str(user.id),
        tenant_id=str(user.tenant_id),
        role=user.role,
        email=user.email,
        access_mode=access_mode,
    )
