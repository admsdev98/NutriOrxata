import { apiDelete, apiGet, apiPost, apiPut } from "../../../shared/api/http";
import type { DishTemplate, DishTemplateIn, DishTemplateListItem } from "../types";

export async function listDishTemplates(token: string, query: string): Promise<DishTemplateListItem[]> {
  const qs = new URLSearchParams();
  if (query.trim()) {
    qs.set("query", query.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<DishTemplateListItem[]>(`/api/food/dish-templates${suffix}`, token);
}

export async function getDishTemplate(token: string, templateId: string): Promise<DishTemplate> {
  return apiGet<DishTemplate>(`/api/food/dish-templates/${templateId}`, token);
}

export async function createDishTemplate(token: string, payload: DishTemplateIn): Promise<DishTemplate> {
  return apiPost<DishTemplate>("/api/food/dish-templates", token, payload);
}

export async function updateDishTemplate(token: string, templateId: string, payload: DishTemplateIn): Promise<DishTemplate> {
  return apiPut<DishTemplate>(`/api/food/dish-templates/${templateId}`, token, payload);
}

export async function deleteDishTemplate(token: string, templateId: string): Promise<void> {
  await apiDelete(`/api/food/dish-templates/${templateId}`, token);
}
