# Food Library and Dish Templates

## Goal

Enable workers to build reusable nutrition building blocks (ingredients and dish templates) that make weekly planning fast.

## Primary Users

- Worker (nutritionist/trainer).

## Concepts

### Ingredient

A tenant-scoped reusable food item with macro nutrition data.

Proposed v1 representation:

- Macro values are stored per 100g.
- Optional `serving_size_g` can be stored for convenience, but grams remains the canonical unit.

### Dish template

A tenant-scoped reusable recipe-like template composed of ingredient items and quantities.

Rules:

- A dish template is not a plan instance.
- Dish template macros are computed from its items.

## Required Surfaces

- Worker can list/search ingredients.
- Worker can create/update/delete ingredients.
- Worker can list/search dish templates.
- Worker can create/update/delete dish templates.

## Required Fields (v1)

Ingredient:

- `name` (required)
- `kcal_per_100g` (required)
- `protein_g_per_100g` (required)
- `carbs_g_per_100g` (required)
- `fat_g_per_100g` (required)
- `serving_size_g` (optional)

Dish template:

- `name` (required)
- `items[]` where each item includes:
  - `ingredient_id`
  - `quantity_g`

## Acceptance Criteria

- Tenant-scoped: a worker can only read/write ingredients and dish templates under their tenant.
- Read-only access mode blocks all mutations (create/update/delete) server-side.
- All list/search endpoints support tenant filtering and are index-reviewed.
- UI always renders loading/error/empty states.
- Common flow stays within 2-3 clicks:
  - open food library -> create ingredient -> see it in list
  - open dish templates -> create dish from existing ingredients -> see computed macros

## Error Contract (UI-facing)

- Mutations in read-only mode return deterministic `403` with `detail="read_only"`.
- Missing resources return deterministic `404`.

## Non-goals (v1)

- Barcode scanning.
- Branded food database integrations.
- Advanced unit conversions beyond grams.
- Full nutrient panels (fiber, micronutrients).
