export type Ingredient = {
  id: string;
  tenant_id: string;
  name: string;
  kcal_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  serving_size_g: number | null;
  created_at: string;
  updated_at: string | null;
};

export type IngredientIn = {
  name: string;
  kcal_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  serving_size_g: number | null;
};

export type DishTemplateListItem = {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
};

export type DishTemplateItemIn = {
  ingredient_id: string;
  quantity_g: number;
};

export type DishTemplateIn = {
  name: string;
  items: DishTemplateItemIn[];
};

export type DishTemplateItem = {
  ingredient_id: string;
  ingredient_name: string;
  quantity_g: number;
};

export type MacroTotals = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type DishTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  items: DishTemplateItem[];
  totals: MacroTotals;
  created_at: string;
  updated_at: string | null;
};

export type UsedByDishTemplate = {
  id: string;
  name: string;
};
