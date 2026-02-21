# Database Schema (Generated Snapshot)

Generated from current SQLAlchemy domain models.

Last refreshed: 2026-02-21 (manual snapshot).

Source of truth for object names:

- `apps/api/alembic/versions/0001_init_auth.py`
- `apps/api/alembic/versions/0002_nutrition_profiles.py`
- `apps/api/alembic/versions/0003_food_library.py`

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

### `nutrition_profiles`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `user_id` UUID FK -> `users.id`
- `sex` text
- `birth_date` date
- `height_cm` integer
- `weight_kg` numeric(5,2)
- `activity_level` text
- `goal` text (default `maintain`)
- `override_kcal` integer nullable
- `override_protein_g` integer nullable
- `override_carbs_g` integer nullable
- `override_fat_g` integer nullable
- `created_at` timestamptz
- `updated_at` timestamptz nullable

### `ingredients`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `name` text
- `kcal_per_100g` numeric(7,2)
- `protein_g_per_100g` numeric(7,2)
- `carbs_g_per_100g` numeric(7,2)
- `fat_g_per_100g` numeric(7,2)
- `serving_size_g` numeric(7,2) nullable
- `created_at` timestamptz
- `updated_at` timestamptz nullable

### `dish_templates`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `name` text
- `created_at` timestamptz
- `updated_at` timestamptz nullable

### `dish_template_items`

- `id` UUID PK
- `tenant_id` UUID FK -> `tenants.id`
- `dish_template_id` UUID FK -> `dish_templates.id`
- `ingredient_id` UUID FK -> `ingredients.id`
- `quantity_g` numeric(8,2)
- `created_at` timestamptz

## Constraints

- `uq_email_verification_tokens_token_hash` (unique on `email_verification_tokens.token_hash`)
- `uq_nutrition_profiles_tenant_user` (unique on `nutrition_profiles(tenant_id, user_id)`)

## Indexes

- `ix_tenants_status`
- `ix_tenants_trial_ends_at`
- `ix_users_tenant_role`
- `ix_email_verification_tokens_expires_at`
- `ix_nutrition_profiles_tenant_id`
- `ix_nutrition_profiles_user_id`
- `ix_ingredients_tenant_id`
- `ix_ingredients_tenant_name`
- `ix_dish_templates_tenant_id`
- `ix_dish_templates_tenant_name`
- `ix_dish_template_items_tenant_id`
- `ix_dish_template_items_template_id`
- `ix_dish_template_items_ingredient_id`
- `ix_dish_template_items_tenant_ingredient_id`
