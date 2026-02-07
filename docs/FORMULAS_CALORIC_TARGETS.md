# Caloric Targets - Formulas (Draft)

This document defines the calorie target formulas and how we present them in product.

Important: the app provides calculation assistance, not medical advice. Worker always owns the final decision.

## 1) Required inputs (baseline)

- Sex (optional if worker chooses formulas that do not require it)
- Age
- Weight (kg)
- Height (cm)
- Activity level (factor)

Optional inputs:

- Body fat % (enables Katch-McArdle)

## 2) Supported formulas (3)

We should support 3 commonly used, evidence-backed baselines:

1) Mifflin-St Jeor (BMR)
2) Harris-Benedict (revised) (BMR)
3) Katch-McArdle (BMR; requires lean body mass)

Output flow:

- Compute BMR.
- Apply activity factor to get TDEE.
- Apply phase adjustment (cut/maintenance/bulk) to produce suggested target.
- Worker selects a formula result as baseline and can override the final target.

## 3) Activity factors (default)

Keep the list short and understandable:

- Sedentary: 1.2
- Lightly active: 1.375
- Moderately active: 1.55
- Very active: 1.725
- Extremely active: 1.9

## 4) Phase adjustments (default)

Defaults must be editable by worker per client:

- Cut: -10% to -25% of TDEE (default -15%)
- Maintenance: 0%
- Bulk: +5% to +15% (default +10%)

## 5) UI rules

- Always show:
  - formula used
  - inputs used
  - computed TDEE
  - suggested target
  - final target (editable)
- If a required input for a selected formula is missing, disable that formula and explain why.
