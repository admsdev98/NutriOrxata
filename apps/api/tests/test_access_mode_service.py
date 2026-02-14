from __future__ import annotations

from datetime import timedelta

from app.modules.auth.domain.enums import SubscriptionStatus, TenantStatus
from app.modules.auth.domain.models import Tenant
from app.modules.auth.service.access_mode import now_utc, tenant_access_mode


def test_tenant_access_mode_is_blocked_when_tenant_is_not_active() -> None:
    tenant = Tenant(status=TenantStatus.disabled.value)
    assert tenant_access_mode(tenant) == "blocked"


def test_tenant_access_mode_is_active_when_subscription_is_active() -> None:
    tenant = Tenant(
        status=TenantStatus.active.value,
        subscription_status=SubscriptionStatus.active.value,
    )
    assert tenant_access_mode(tenant) == "active"


def test_tenant_access_mode_is_expired_when_trial_end_has_passed() -> None:
    tenant = Tenant(
        status=TenantStatus.active.value,
        subscription_status=SubscriptionStatus.trial.value,
        trial_ends_at=now_utc() - timedelta(minutes=1),
    )
    assert tenant_access_mode(tenant) == "expired"


def test_tenant_access_mode_is_trial_when_trial_is_still_valid() -> None:
    tenant = Tenant(
        status=TenantStatus.active.value,
        subscription_status=SubscriptionStatus.trial.value,
        trial_ends_at=now_utc() + timedelta(days=1),
    )
    assert tenant_access_mode(tenant) == "trial"
