# Nutrition Profile and Targets

## Goal

Allow a user to store a nutrition profile and retrieve daily/weekly macro targets.

## Inputs (Profile)

- Sex: `male | female`
- Birth date
- Height (cm)
- Weight (kg)
- Activity level: `sedentary | light | moderate | very_active | athlete`
- Goal: `maintain | cut | bulk`

Optional overrides:

- Daily kcal override
- Daily protein/carbs/fat grams override

## Outputs (Targets)

- Daily targets: `kcal`, `protein_g`, `carbs_g`, `fat_g`
- Weekly targets: same fields multiplied by 7
- Warnings list for non-fatal mismatches (e.g. macro energy mismatch)

## Access and Safety

- Tenant-scoped: a user can only read/write their own profile under their tenant.
- Read-only access mode blocks profile mutation.
