import type { NutritionProfileApi, NutritionProfileForm } from "./types";

function coerceNullableInt(raw: string): number | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("invalid_integer_field");
  }
  return parsed;
}

export function buildProfilePayload(form: NutritionProfileForm): NutritionProfileApi {
  const heightCm = Number(form.heightCm);
  const weightKg = Number(form.weightKg);

  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error("invalid_height_cm");
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("invalid_weight_kg");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
    throw new Error("invalid_birth_date");
  }

  return {
    sex: form.sex,
    birth_date: form.birthDate,
    height_cm: Math.round(heightCm),
    weight_kg: Number(weightKg.toFixed(2)),
    activity_level: form.activityLevel,
    goal: form.goal,
    override_kcal: coerceNullableInt(form.overrideKcal),
    override_protein_g: coerceNullableInt(form.overrideProteinG),
    override_carbs_g: coerceNullableInt(form.overrideCarbsG),
    override_fat_g: coerceNullableInt(form.overrideFatG),
  };
}

export function profileToForm(profile: NutritionProfileApi): NutritionProfileForm {
  return {
    sex: profile.sex,
    birthDate: profile.birth_date,
    heightCm: String(profile.height_cm),
    weightKg: String(profile.weight_kg),
    activityLevel: profile.activity_level,
    goal: profile.goal,
    overrideKcal: profile.override_kcal == null ? "" : String(profile.override_kcal),
    overrideProteinG: profile.override_protein_g == null ? "" : String(profile.override_protein_g),
    overrideCarbsG: profile.override_carbs_g == null ? "" : String(profile.override_carbs_g),
    overrideFatG: profile.override_fat_g == null ? "" : String(profile.override_fat_g),
  };
}
