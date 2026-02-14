from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class NutritionInputs:
    sex: str
    age_years: int
    height_cm: int
    weight_kg: float
    activity_level: str
    goal: str

    override_kcal: int | None = None
    override_protein_g: int | None = None
    override_carbs_g: int | None = None
    override_fat_g: int | None = None


@dataclass(frozen=True)
class NutritionTargets:
    daily_kcal: int
    daily_protein_g: int
    daily_carbs_g: int
    daily_fat_g: int

    weekly_kcal: int
    weekly_protein_g: int
    weekly_carbs_g: int
    weekly_fat_g: int

    warnings: list[str]


def age_years_from_birth_date(*, birth_date: date, as_of: date) -> int:
    years = as_of.year - birth_date.year
    if (as_of.month, as_of.day) < (birth_date.month, birth_date.day):
        years -= 1
    return max(0, years)


def _activity_factor(level: str) -> float:
    mapping = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "very_active": 1.725,
        "athlete": 1.9,
    }
    if level not in mapping:
        raise ValueError("invalid_activity_level")
    return mapping[level]


def _goal_delta_kcal(goal: str) -> int:
    mapping = {
        "maintain": 0,
        "cut": -500,
        "bulk": 250,
    }
    if goal not in mapping:
        raise ValueError("invalid_goal")
    return mapping[goal]


def _bmr_mifflin_st_jeor(*, sex: str, weight_kg: float, height_cm: int, age_years: int) -> float:
    if sex not in ("male", "female"):
        raise ValueError("invalid_sex")
    s = 5 if sex == "male" else -161
    return (10.0 * weight_kg) + (6.25 * float(height_cm)) - (5.0 * float(age_years)) + float(s)


def calculate_targets(inputs: NutritionInputs) -> NutritionTargets:
    warnings: list[str] = []

    bmr = _bmr_mifflin_st_jeor(
        sex=inputs.sex,
        weight_kg=inputs.weight_kg,
        height_cm=inputs.height_cm,
        age_years=inputs.age_years,
    )
    tdee = bmr * _activity_factor(inputs.activity_level)
    kcal_base = int(round(tdee)) + _goal_delta_kcal(inputs.goal)
    kcal = int(inputs.override_kcal) if inputs.override_kcal is not None else kcal_base
    kcal = max(0, kcal)

    protein_g_default = int(round(inputs.weight_kg * 2.0))
    fat_g_default = int(round(inputs.weight_kg * 0.8))
    protein_g = int(inputs.override_protein_g) if inputs.override_protein_g is not None else protein_g_default
    fat_g = int(inputs.override_fat_g) if inputs.override_fat_g is not None else fat_g_default
    protein_g = max(0, protein_g)
    fat_g = max(0, fat_g)

    if inputs.override_carbs_g is not None:
        carbs_g = max(0, int(inputs.override_carbs_g))
    else:
        remainder_kcal = kcal - (protein_g * 4) - (fat_g * 9)
        if remainder_kcal < 0:
            warnings.append("macro_remainder_negative")
            remainder_kcal = 0
        carbs_g = int(round(remainder_kcal / 4.0))

    macro_kcal = (protein_g * 4) + (carbs_g * 4) + (fat_g * 9)
    delta = int(kcal) - int(macro_kcal)
    if abs(delta) >= 50:
        warnings.append(f"macro_energy_mismatch;delta_kcal={delta}")

    return NutritionTargets(
        daily_kcal=int(kcal),
        daily_protein_g=int(protein_g),
        daily_carbs_g=int(carbs_g),
        daily_fat_g=int(fat_g),
        weekly_kcal=int(kcal) * 7,
        weekly_protein_g=int(protein_g) * 7,
        weekly_carbs_g=int(carbs_g) * 7,
        weekly_fat_g=int(fat_g) * 7,
        warnings=warnings,
    )
