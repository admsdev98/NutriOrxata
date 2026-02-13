from __future__ import annotations

import enum


class TenantStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    disabled = "disabled"
    deleted = "deleted"


class SubscriptionStatus(str, enum.Enum):
    trial = "trial"
    active = "active"
    expired = "expired"


class UserRole(str, enum.Enum):
    worker = "worker"
    client = "client"
