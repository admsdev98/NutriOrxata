# Database Schema (Generated Snapshot)

Generated from current SQLAlchemy domain models.

## Tables

### `tenants`

- `id` UUID PK
- `status` text
- `subscription_status` text
- `trial_starts_at` timestamptz nullable
- `trial_ends_at` timestamptz nullable
- `manual_unlock_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz nullable

### `users`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `role` text
- `email` text
- `email_verified_at` timestamptz nullable
- `password_hash` text
- `is_active` bool
- `locale` text
- `timezone` text
- `created_at` timestamptz
- `updated_at` timestamptz nullable

### `email_verification_tokens`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `user_id` UUID FK -> `users.id`
- `token_hash` bytea unique
- `expires_at` timestamptz
- `consumed_at` timestamptz nullable
- `created_at` timestamptz

## Indexes

- `ix_tenants_status`
- `ix_tenants_trial_ends_at`
- `ix_users_tenant_role`
- `ix_email_verification_tokens_expires_at`
