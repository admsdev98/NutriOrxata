export type NutritionProfileForm = {
  sex: "male" | "female";
  birthDate: string;
  heightCm: string;
  weightKg: string;
  activityLevel: "sedentary" | "light" | "moderate" | "very_active" | "athlete";
  goal: "maintain" | "cut" | "bulk";
  overrideKcal: string;
  overrideProteinG: string;
  overrideCarbsG: string;
  overrideFatG: string;
};

export type NutritionProfileApi = {
  sex: "male" | "female";
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  activity_level: "sedentary" | "light" | "moderate" | "very_active" | "athlete";
  goal: "maintain" | "cut" | "bulk";
  override_kcal: number | null;
  override_protein_g: number | null;
  override_carbs_g: number | null;
  override_fat_g: number | null;
};

export type NutritionTargetsApi = {
  daily: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  weekly: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  warnings: string[];
};

export const DEFAULT_PROFILE_FORM: NutritionProfileForm = {
  sex: "male",
  birthDate: "1990-01-01",
  heightCm: "180",
  weightKg: "80",
  activityLevel: "moderate",
  goal: "maintain",
  overrideKcal: "",
  overrideProteinG: "",
  overrideCarbsG: "",
  overrideFatG: "",
};
