from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.db.session import get_session
from app.modules.auth.domain import SubscriptionStatus, Tenant, TenantStatus, User, UserRole
from app.modules.auth.security.passwords import hash_password, verify_password


logger = logging.getLogger(__name__)


def ensure_dev_worker_seed() -> None:
    if settings.api_environment != "development":
        return
    if not settings.dev_seed_worker_enabled:
        return

    email = settings.dev_seed_worker_email.strip().lower()
    password = settings.dev_seed_worker_password
    if not email or not password:
        return

    try:
        session = get_session()
    except RuntimeError:
        logger.warning("Skipped dev worker seed: DATABASE_URL is not configured")
        return

    now = datetime.now(timezone.utc)

    try:
        user = session.execute(
            select(User).where(
                User.email == email,
                User.role == UserRole.worker.value,
            )
        ).scalar_one_or_none()

        if user is None:
            tenant = Tenant(
                id=uuid.uuid4(),
                status=TenantStatus.active.value,
                subscription_status=SubscriptionStatus.active.value,
                trial_starts_at=now,
                trial_ends_at=None,
                manual_unlock_at=None,
                created_at=now,
                updated_at=None,
            )
            session.add(tenant)

            user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                role=UserRole.worker.value,
                email=email,
                email_verified_at=now,
                password_hash=hash_password(password),
                is_active=True,
                locale="es-ES",
                timezone="Europe/Madrid",
                created_at=now,
                updated_at=None,
            )
            session.add(user)
            session.commit()
            logger.info("Created dev worker seed user: %s", email)
            return

        changed = False
        if user.email_verified_at is None:
            user.email_verified_at = now
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if not verify_password(password, user.password_hash):
            user.password_hash = hash_password(password)
            changed = True

        tenant = session.execute(select(Tenant).where(Tenant.id == user.tenant_id)).scalar_one_or_none()
        if tenant is None:
            tenant = Tenant(
                id=user.tenant_id,
                status=TenantStatus.active.value,
                subscription_status=SubscriptionStatus.active.value,
                trial_starts_at=now,
                trial_ends_at=None,
                manual_unlock_at=None,
                created_at=now,
                updated_at=None,
            )
            session.add(tenant)
            changed = True
        else:
            if tenant.status != TenantStatus.active.value:
                tenant.status = TenantStatus.active.value
                changed = True
            if tenant.subscription_status != SubscriptionStatus.active.value:
                tenant.subscription_status = SubscriptionStatus.active.value
                changed = True

        if changed:
            session.commit()
            logger.info("Updated dev worker seed user: %s", email)
    except Exception:
        session.rollback()
        logger.exception("Failed to ensure dev worker seed user")
    finally:
        session.close()
