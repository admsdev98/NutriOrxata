export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type WeekPlanTemplateListItem = {
  id: string;
  tenant_id: string;
  name: string;
  item_count: number;
  created_at: string;
  updated_at: string | null;
};

export type WeekPlanTemplateItem = {
  id: string;
  day_key: DayKey;
  slot_key: string;
  dish_template_id: string | null;
  dish_template_name: string | null;
  notes: string | null;
  position: number;
};

export type WeekPlanTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  items: WeekPlanTemplateItem[];
  created_at: string;
  updated_at: string | null;
};

export type WeekPlanTemplateItemIn = {
  day_key: DayKey;
  slot_key: string;
  dish_template_id: string | null;
  notes: string | null;
};

export type WeekPlanTemplateIn = {
  name: string;
  items: WeekPlanTemplateItemIn[];
};

export type WeekPlanInstanceItem = {
  id: string;
  source_template_item_id: string | null;
  day_key: DayKey;
  slot_key: string;
  dish_template_id: string | null;
  dish_name: string | null;
  notes: string | null;
  position: number;
};

export type WeekPlanInstance = {
  id: string;
  tenant_id: string;
  template_id: string | null;
  client_ref: string;
  week_start_date: string;
  template_name_snapshot: string | null;
  items: WeekPlanInstanceItem[];
  created_at: string;
  updated_at: string | null;
};

export type WeekPlanInstanceCreateFromTemplateIn = {
  template_id: string;
  client_ref: string;
  week_start_date: string;
};

export type WeekPlanInstanceItemIn = {
  day_key: DayKey;
  slot_key: string;
  dish_template_id: string | null;
  dish_name: string | null;
  notes: string | null;
};

export type WeekPlanInstanceUpdateIn = {
  items: WeekPlanInstanceItemIn[];
};

export type WeekPlanDishSuggestion = {
  id: string;
  name: string;
  meal_type: MealType | null;
  score: number;
};

export const DAY_OPTIONS: Array<{ key: DayKey; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
