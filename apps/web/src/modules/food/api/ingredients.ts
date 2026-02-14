import { apiDelete, apiGet, apiPost, apiPut } from "../../../shared/api/http";
import type { Ingredient, IngredientIn, UsedByDishTemplate } from "../types";

export async function listIngredients(token: string, query: string): Promise<Ingredient[]> {
  const qs = new URLSearchParams();
  if (query.trim()) {
    qs.set("query", query.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<Ingredient[]>(`/api/food/ingredients${suffix}`, token);
}

export async function createIngredient(token: string, payload: IngredientIn): Promise<Ingredient> {
  return apiPost<Ingredient>("/api/food/ingredients", token, payload);
}

export async function updateIngredient(token: string, ingredientId: string, payload: IngredientIn): Promise<Ingredient> {
  return apiPut<Ingredient>(`/api/food/ingredients/${ingredientId}`, token, payload);
}

export async function deleteIngredient(token: string, ingredientId: string): Promise<void> {
  await apiDelete(`/api/food/ingredients/${ingredientId}`, token);
}

export async function ingredientUsedBy(token: string, ingredientId: string): Promise<UsedByDishTemplate[]> {
  return apiGet<UsedByDishTemplate[]>(`/api/food/ingredients/${ingredientId}/used-by`, token);
}
