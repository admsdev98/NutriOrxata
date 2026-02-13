from __future__ import annotations

from datetime import datetime, timezone

from app.modules.auth.domain.enums import SubscriptionStatus, TenantStatus
from app.modules.auth.domain.models import Tenant


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def tenant_access_mode(tenant: Tenant) -> str:
    if tenant.status != TenantStatus.active.value:
        return "blocked"

    if tenant.subscription_status == SubscriptionStatus.active.value:
        return "active"

    if tenant.trial_ends_at and now_utc() >= tenant.trial_ends_at:
        return "expired"

    return "trial"
