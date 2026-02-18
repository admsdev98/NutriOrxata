import { apiDelete, apiGet, apiPost, apiPut } from "../../../shared/api/http";
import type {
  WeekPlanDishSuggestion,
  WeekPlanInstance,
  WeekPlanInstanceCreateFromTemplateIn,
  WeekPlanInstanceUpdateIn,
  WeekPlanTemplate,
  WeekPlanTemplateIn,
  WeekPlanTemplateListItem,
} from "../types";

export async function listWeekPlanTemplates(token: string, query: string): Promise<WeekPlanTemplateListItem[]> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("query", query.trim());
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiGet<WeekPlanTemplateListItem[]>(`/api/planning/week-plan-templates${suffix}`, token);
}

export async function getWeekPlanTemplate(token: string, templateId: string): Promise<WeekPlanTemplate> {
  return apiGet<WeekPlanTemplate>(`/api/planning/week-plan-templates/${templateId}`, token);
}

export async function createWeekPlanTemplate(token: string, payload: WeekPlanTemplateIn): Promise<WeekPlanTemplate> {
  return apiPost<WeekPlanTemplate>("/api/planning/week-plan-templates", token, payload);
}

export async function updateWeekPlanTemplate(
  token: string,
  templateId: string,
  payload: WeekPlanTemplateIn,
): Promise<WeekPlanTemplate> {
  return apiPut<WeekPlanTemplate>(`/api/planning/week-plan-templates/${templateId}`, token, payload);
}

export async function deleteWeekPlanTemplate(token: string, templateId: string): Promise<void> {
  await apiDelete(`/api/planning/week-plan-templates/${templateId}`, token);
}

export async function createWeekPlanInstanceFromTemplate(
  token: string,
  payload: WeekPlanInstanceCreateFromTemplateIn,
): Promise<WeekPlanInstance> {
  return apiPost<WeekPlanInstance>("/api/planning/week-plan-instances/from-template", token, payload);
}

export async function getWeekPlanInstanceByClientWeek(
  token: string,
  clientRef: string,
  weekStartDate: string,
): Promise<WeekPlanInstance> {
  const params = new URLSearchParams({
    client_ref: clientRef,
    week_start_date: weekStartDate,
  });
  return apiGet<WeekPlanInstance>(`/api/planning/week-plan-instances/by-client-week?${params.toString()}`, token);
}

export async function updateWeekPlanInstance(
  token: string,
  instanceId: string,
  payload: WeekPlanInstanceUpdateIn,
): Promise<WeekPlanInstance> {
  return apiPut<WeekPlanInstance>(`/api/planning/week-plan-instances/${instanceId}`, token, payload);
}

export async function listWeekPlanDishSuggestions(
  token: string,
  slotKey: string,
  query: string,
): Promise<WeekPlanDishSuggestion[]> {
  const params = new URLSearchParams({ slot_key: slotKey });
  if (query.trim()) {
    params.set("query", query.trim());
  }
  return apiGet<WeekPlanDishSuggestion[]>(`/api/planning/dish-suggestions?${params.toString()}`, token);
}
