import { useEffect, useMemo, useState } from "react";

import type { ApiError } from "../../../shared/api/http";
import type { AuthSession } from "../../../shared/auth/workerSession";
import { listDishTemplates } from "../../food/api/dishTemplates";
import {
  createWeekPlanInstanceFromTemplate,
  createWeekPlanTemplate,
  deleteWeekPlanTemplate,
  getWeekPlanInstanceByClientWeek,
  getWeekPlanTemplate,
  listWeekPlanDishSuggestions,
  listWeekPlanTemplates,
  updateWeekPlanInstance,
  updateWeekPlanTemplate,
} from "../api/weekPlanning";
import type {
  DayKey,
  WeekPlanInstance,
  WeekPlanInstanceItemIn,
  WeekPlanTemplate,
  WeekPlanTemplateItemIn,
  WeekPlanTemplateListItem,
} from "../types";
import { DAY_OPTIONS } from "../types";

type Props = {
  clientRef: string;
  selectedClientName: string;
  authSession: AuthSession | null;
  canMutate: boolean;
};

type DishOption = {
  id: string;
  name: string;
};

type BulkScope = "day" | "selected_days" | "week";

function asIsoDate(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function startOfWeekIso(today: Date): string {
  const copy = new Date(today);
  const day = copy.getDay();
  const mondayDelta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayDelta);
  return asIsoDate(copy);
}

function shiftWeek(isoDate: string, deltaWeeks: number): string {
  const base = new Date(`${isoDate}T00:00:00`);
  base.setDate(base.getDate() + deltaWeeks * 7);
  return asIsoDate(base);
}

function dayLabel(dayKey: DayKey): string {
  const found = DAY_OPTIONS.find((option) => option.key === dayKey);
  return found ? found.label : dayKey;
}

function normalizeNotes(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function defaultInstanceItem(): WeekPlanInstanceItemIn {
  return {
    day_key: "mon",
    slot_key: "snack_1",
    dish_template_id: null,
    dish_name: null,
    notes: null,
  };
}

function defaultTemplateItem(): WeekPlanTemplateItemIn {
  return {
    day_key: "mon",
    slot_key: "snack_1",
    dish_template_id: null,
    notes: null,
  };
}

function templateToDraft(template: WeekPlanTemplate): WeekPlanTemplateItemIn[] {
  if (!template.items.length) {
    return [defaultTemplateItem()];
  }
  return template.items.map((item) => ({
    day_key: item.day_key,
    slot_key: item.slot_key,
    dish_template_id: item.dish_template_id,
    notes: item.notes,
  }));
}

export function WeeklyPlanTabPanel({ clientRef, selectedClientName, authSession, canMutate }: Props) {
  const [weekStartDate, setWeekStartDate] = useState(() => startOfWeekIso(new Date()));

  const [templatesQuery, setTemplatesQuery] = useState("");
  const [templates, setTemplates] = useState<WeekPlanTemplateListItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesMessage, setTemplatesMessage] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [templateEditorName, setTemplateEditorName] = useState("");
  const [templateEditorItems, setTemplateEditorItems] = useState<WeekPlanTemplateItemIn[]>([defaultTemplateItem()]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateActionLoading, setTemplateActionLoading] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const [dishes, setDishes] = useState<DishOption[]>([]);

  const [instance, setInstance] = useState<WeekPlanInstance | null>(null);
  const [draftItems, setDraftItems] = useState<WeekPlanInstanceItemIn[]>([]);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [instanceMessage, setInstanceMessage] = useState<string | null>(null);

  const [bulkSlotKey, setBulkSlotKey] = useState("breakfast");
  const [bulkDishTemplateId, setBulkDishTemplateId] = useState("");
  const [bulkScope, setBulkScope] = useState<BulkScope>("day");
  const [bulkDay, setBulkDay] = useState<DayKey>("mon");
  const [bulkSelectedDays, setBulkSelectedDays] = useState<DayKey[]>(["mon", "tue", "wed"]);
  const [bulkSuggestionQuery, setBulkSuggestionQuery] = useState("");
  const [bulkSuggestions, setBulkSuggestions] = useState<DishOption[]>([]);
  const [bulkSuggestionsLoading, setBulkSuggestionsLoading] = useState(false);
  const [bulkSuggestionsMessage, setBulkSuggestionsMessage] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canWrite = canMutate && authSession?.accessMode === "active";
  const dishNameById = useMemo(() => new Map(dishes.map((dish) => [dish.id, dish.name] as const)), [dishes]);
  const suggestionIds = useMemo(() => new Set(bulkSuggestions.map((dish) => dish.id)), [bulkSuggestions]);

  async function reloadTemplates(token: string, preferredTemplateId?: string) {
    setTemplatesLoading(true);
    setTemplatesMessage(null);
    try {
      const rows = await listWeekPlanTemplates(token, templatesQuery);
      setTemplates(rows);
      setSelectedTemplateId((current) => {
        const preferred = preferredTemplateId?.trim();
        if (preferred && rows.some((row) => row.id === preferred)) {
          return preferred;
        }
        if (current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? "";
      });
    } catch (error) {
      const apiError = error as ApiError;
      setTemplatesMessage(apiError.detail ?? "Failed to load week plan templates.");
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function reloadSelectedTemplate(token: string, templateId: string) {
    setTemplateLoading(true);
    setTemplateMessage(null);
    try {
      const template = await getWeekPlanTemplate(token, templateId);
      setTemplateEditorName(template.name);
      setTemplateEditorItems(templateToDraft(template));
      setBulkSlotKey(template.items[0]?.slot_key ?? "breakfast");
    } catch (error) {
      const apiError = error as ApiError;
      setTemplateEditorName("");
      setTemplateEditorItems([defaultTemplateItem()]);
      setTemplateMessage(apiError.detail ?? "Failed to load template details.");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function reloadDishes(token: string) {
    try {
      const rows = await listDishTemplates(token, "");
      setDishes(rows.map((row) => ({ id: row.id, name: row.name })));
    } catch {
      setDishes([]);
    }
  }

  async function reloadInstance(token: string) {
    setInstanceLoading(true);
    setInstanceMessage(null);
    try {
      const row = await getWeekPlanInstanceByClientWeek(token, clientRef, weekStartDate);
      setInstance(row);
      setDraftItems(
        row.items.map((item) => ({
          day_key: item.day_key,
          slot_key: item.slot_key,
          dish_template_id: item.dish_template_id,
          dish_name: item.dish_name,
          notes: item.notes,
        })),
      );
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        setInstance(null);
        setDraftItems([]);
        setInstanceMessage("No week plan instance for this client and week.");
      } else {
        setInstance(null);
        setDraftItems([]);
        setInstanceMessage(apiError.detail ?? "Failed to load week plan instance.");
      }
    } finally {
      setInstanceLoading(false);
    }
  }

  useEffect(() => {
    if (!authSession) {
      setTemplates([]);
      setDishes([]);
      setInstance(null);
      setDraftItems([]);
      setTemplateEditorName("");
      setTemplateEditorItems([defaultTemplateItem()]);
      return;
    }
    void reloadTemplates(authSession.token);
  }, [authSession, templatesQuery]);

  useEffect(() => {
    if (!authSession) {
      return;
    }
    if (!selectedTemplateId) {
      setTemplateEditorName("");
      setTemplateEditorItems([defaultTemplateItem()]);
      return;
    }
    void reloadSelectedTemplate(authSession.token, selectedTemplateId);
  }, [authSession, selectedTemplateId]);

  useEffect(() => {
    if (!authSession) {
      return;
    }
    void reloadDishes(authSession.token);
  }, [authSession]);

  useEffect(() => {
    if (!authSession) {
      return;
    }
    void reloadInstance(authSession.token);
  }, [authSession, clientRef, weekStartDate]);

  useEffect(() => {
    if (!authSession || !bulkSlotKey.trim()) {
      setBulkSuggestions([]);
      setBulkSuggestionsMessage(null);
      return;
    }

    let cancelled = false;
    setBulkSuggestionsLoading(true);
    setBulkSuggestionsMessage(null);

    (async () => {
      try {
        const rows = await listWeekPlanDishSuggestions(authSession.token, bulkSlotKey, bulkSuggestionQuery);
        if (!cancelled) {
          setBulkSuggestions(rows.map((row) => ({ id: row.id, name: row.name })));
        }
      } catch (error) {
        if (!cancelled) {
          const apiError = error as ApiError;
          setBulkSuggestions([]);
          setBulkSuggestionsMessage(apiError.detail ?? "Failed to load suggestions.");
        }
      } finally {
        if (!cancelled) {
          setBulkSuggestionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authSession, bulkSlotKey, bulkSuggestionQuery]);

  function buildTemplatePayload() {
    const name = templateEditorName.trim();
    if (!name) {
      setTemplateMessage("Template name is required.");
      return null;
    }

    const items = templateEditorItems
      .map((item) => ({
        ...item,
        slot_key: item.slot_key.trim(),
        notes: normalizeNotes(item.notes),
      }))
      .filter((item) => item.slot_key);

    if (!items.length) {
      setTemplateMessage("Template must include at least one slot.");
      return null;
    }

    return { name, items };
  }

  async function handleCreateTemplate() {
    if (!authSession) {
      setTemplateMessage("Login is required.");
      return;
    }
    if (!canWrite) {
      setTemplateMessage("Mutation blocked by read-only mode.");
      return;
    }

    const payload = buildTemplatePayload();
    if (!payload) {
      return;
    }

    setTemplateActionLoading(true);
    setTemplateMessage(null);
    try {
      const created = await createWeekPlanTemplate(authSession.token, payload);
      setSelectedTemplateId(created.id);
      setTemplateEditorName(created.name);
      setTemplateEditorItems(templateToDraft(created));
      await reloadTemplates(authSession.token, created.id);
      setTemplateMessage("Template created.");
    } catch (error) {
      const apiError = error as ApiError;
      setTemplateMessage(apiError.detail ?? "Failed to create template.");
    } finally {
      setTemplateActionLoading(false);
    }
  }

  async function handleUpdateTemplate() {
    if (!authSession) {
      setTemplateMessage("Login is required.");
      return;
    }
    if (!selectedTemplateId) {
      setTemplateMessage("Select a template first.");
      return;
    }
    if (!canWrite) {
      setTemplateMessage("Mutation blocked by read-only mode.");
      return;
    }

    const payload = buildTemplatePayload();
    if (!payload) {
      return;
    }

    setTemplateActionLoading(true);
    setTemplateMessage(null);
    try {
      const updated = await updateWeekPlanTemplate(authSession.token, selectedTemplateId, payload);
      setTemplateEditorName(updated.name);
      setTemplateEditorItems(templateToDraft(updated));
      await reloadTemplates(authSession.token, updated.id);
      setTemplateMessage("Template updated.");
    } catch (error) {
      const apiError = error as ApiError;
      setTemplateMessage(apiError.detail ?? "Failed to update template.");
    } finally {
      setTemplateActionLoading(false);
    }
  }

  async function handleDeleteTemplate() {
    if (!authSession) {
      setTemplateMessage("Login is required.");
      return;
    }
    if (!selectedTemplateId) {
      setTemplateMessage("Select a template first.");
      return;
    }
    if (!canWrite) {
      setTemplateMessage("Mutation blocked by read-only mode.");
      return;
    }
    if (typeof window !== "undefined") {
      const approved = window.confirm("Delete selected template?");
      if (!approved) {
        return;
      }
    }

    setTemplateActionLoading(true);
    setTemplateMessage(null);
    try {
      await deleteWeekPlanTemplate(authSession.token, selectedTemplateId);
      await reloadTemplates(authSession.token);
      setTemplateEditorName("");
      setTemplateEditorItems([defaultTemplateItem()]);
      setTemplateMessage("Template deleted.");
    } catch (error) {
      const apiError = error as ApiError;
      setTemplateMessage(apiError.detail ?? "Failed to delete template.");
    } finally {
      setTemplateActionLoading(false);
    }
  }

  async function handleCreateFromTemplate() {
    if (!authSession) {
      setActionMessage("Login is required.");
      return;
    }
    if (!selectedTemplateId) {
      setActionMessage("Select a template first.");
      return;
    }
    if (!canWrite) {
      setActionMessage("Mutation blocked by read-only mode.");
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      const created = await createWeekPlanInstanceFromTemplate(authSession.token, {
        template_id: selectedTemplateId,
        client_ref: clientRef,
        week_start_date: weekStartDate,
      });
      setInstance(created);
      setDraftItems(
        created.items.map((item) => ({
          day_key: item.day_key,
          slot_key: item.slot_key,
          dish_template_id: item.dish_template_id,
          dish_name: item.dish_name,
          notes: item.notes,
        })),
      );
      setActionMessage("Week instance created from template.");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 409 && apiError.detail === "week_plan_instance_exists") {
        await reloadInstance(authSession.token);
        setActionMessage("Week instance already exists for this client and week.");
      } else {
        setActionMessage(apiError.detail ?? "Failed to create week instance.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  function toggleSelectedBulkDay(dayKey: DayKey) {
    setBulkSelectedDays((current) => {
      if (current.includes(dayKey)) {
        return current.filter((day) => day !== dayKey);
      }
      return [...current, dayKey];
    });
  }

  function targetDays(): DayKey[] {
    if (bulkScope === "day") {
      return [bulkDay];
    }
    if (bulkScope === "selected_days") {
      return bulkSelectedDays;
    }
    return DAY_OPTIONS.map((day) => day.key);
  }

  function handleApplyBulkAssignment() {
    if (!instance) {
      setActionMessage("Create or load an instance before bulk assignment.");
      return;
    }
    if (!canWrite) {
      setActionMessage("Mutation blocked by read-only mode.");
      return;
    }

    const normalizedSlot = bulkSlotKey.trim();
    if (!normalizedSlot) {
      setActionMessage("Bulk assignment requires a slot key.");
      return;
    }

    if (!bulkDishTemplateId) {
      setActionMessage("Select a dish for bulk assignment.");
      return;
    }

    const days = targetDays();
    if (!days.length) {
      setActionMessage("Select at least one target day.");
      return;
    }

    const resolvedDishName = dishNameById.get(bulkDishTemplateId) ?? null;

    setDraftItems((current) => {
      const next = [...current];
      for (const day of days) {
        const index = next.findIndex(
          (item) => item.day_key === day && item.slot_key.trim().toLowerCase() === normalizedSlot.toLowerCase(),
        );
        if (index >= 0) {
          next[index] = {
            ...next[index],
            slot_key: normalizedSlot,
            dish_template_id: bulkDishTemplateId,
            dish_name: resolvedDishName,
          };
        } else {
          next.push({
            day_key: day,
            slot_key: normalizedSlot,
            dish_template_id: bulkDishTemplateId,
            dish_name: resolvedDishName,
            notes: null,
          });
        }
      }
      return next;
    });
    setActionMessage(`Bulk assignment applied to ${days.length} day(s).`);
  }

  async function handleSaveInstance() {
    if (!authSession) {
      setActionMessage("Login is required.");
      return;
    }
    if (!instance) {
      setActionMessage("Create or load an instance before saving.");
      return;
    }
    if (!canWrite) {
      setActionMessage("Mutation blocked by read-only mode.");
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      const payload: WeekPlanInstanceItemIn[] = draftItems
        .map((item) => ({
          ...item,
          slot_key: item.slot_key.trim(),
          dish_name: item.dish_template_id ? dishNameById.get(item.dish_template_id) ?? item.dish_name : item.dish_name,
          notes: normalizeNotes(item.notes),
        }))
        .filter((item) => item.slot_key);

      if (!payload.length) {
        setActionMessage("Add at least one slot before saving.");
        return;
      }

      const saved = await updateWeekPlanInstance(authSession.token, instance.id, { items: payload });
      setInstance(saved);
      setDraftItems(
        saved.items.map((item) => ({
          day_key: item.day_key,
          slot_key: item.slot_key,
          dish_template_id: item.dish_template_id,
          dish_name: item.dish_name,
          notes: item.notes,
        })),
      );
      setActionMessage("Week instance saved.");
    } catch (error) {
      const apiError = error as ApiError;
      setActionMessage(apiError.detail ?? "Failed to save week instance.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Weekly planning for {selectedClientName}</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => setWeekStartDate((value) => shiftWeek(value, -1))}
            className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-800"
          >
            Previous week
          </button>

          <label className="space-y-1 text-xs text-neutral-400">
            Week start
            <input
              type="date"
              value={weekStartDate}
              onChange={(event) => setWeekStartDate(event.target.value)}
              className="block rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
            />
          </label>

          <button
            type="button"
            onClick={() => setWeekStartDate((value) => shiftWeek(value, 1))}
            className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-800"
          >
            Next week
          </button>
        </div>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs text-neutral-400">
            Template search
            <input
              value={templatesQuery}
              onChange={(event) => setTemplatesQuery(event.target.value)}
              placeholder="Search templates..."
              className="block rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
            />
          </label>

          <label className="space-y-1 text-xs text-neutral-400">
            Template
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              className="block rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
            >
              <option value="">Select template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.item_count})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={!authSession || !canWrite || actionLoading || !selectedTemplateId}
            onClick={() => {
              void handleCreateFromTemplate();
            }}
            className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create from template
          </button>
        </div>

        {templatesLoading ? <p className="mt-2 text-sm text-neutral-400">Loading templates...</p> : null}
        {templatesMessage ? <p className="mt-2 text-sm text-amber-300">{templatesMessage}</p> : null}

        <div className="mt-3 rounded border border-neutral-800 p-3">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Template editor</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <input
              value={templateEditorName}
              onChange={(event) => setTemplateEditorName(event.target.value)}
              placeholder="Template name"
              disabled={!canWrite || templateActionLoading}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => {
                void handleCreateTemplate();
              }}
              disabled={!authSession || !canWrite || templateActionLoading}
              className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              New template
            </button>
            <button
              type="button"
              onClick={() => {
                void handleUpdateTemplate();
              }}
              disabled={!authSession || !canWrite || templateActionLoading || !selectedTemplateId}
              className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update template
            </button>
            <button
              type="button"
              onClick={() => {
                void handleDeleteTemplate();
              }}
              disabled={!authSession || !canWrite || templateActionLoading || !selectedTemplateId}
              className="rounded border border-neutral-700 px-3 py-2 text-xs text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {templateLoading ? <p className="mt-2 text-sm text-neutral-400">Loading template detail...</p> : null}
          {templateMessage ? <p className="mt-2 text-sm text-neutral-300">{templateMessage}</p> : null}

          <div className="mt-3 space-y-2">
            {templateEditorItems.map((item, index) => (
              <div
                key={`${item.day_key}-${item.slot_key}-${index}`}
                className="grid gap-2 rounded border border-neutral-800 p-2 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <select
                  value={item.day_key}
                  disabled={!canWrite || templateActionLoading}
                  onChange={(event) => {
                    const nextDay = event.target.value as DayKey;
                    setTemplateEditorItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, day_key: nextDay } : row)),
                    );
                  }}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.key} value={day.key}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <input
                  value={item.slot_key}
                  disabled={!canWrite || templateActionLoading}
                  onChange={(event) => {
                    const nextSlot = event.target.value;
                    setTemplateEditorItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, slot_key: nextSlot } : row)),
                    );
                  }}
                  placeholder="slot_key"
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <select
                  value={item.dish_template_id ?? ""}
                  disabled={!canWrite || templateActionLoading}
                  onChange={(event) => {
                    const nextId = event.target.value.trim() ? event.target.value : null;
                    setTemplateEditorItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, dish_template_id: nextId } : row)),
                    );
                  }}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">No dish template</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateEditorItems((current) =>
                      current.length <= 1 ? current : current.filter((_, rowIndex) => rowIndex !== index),
                    );
                  }}
                  disabled={!canWrite || templateActionLoading}
                  className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>

                <input
                  value={item.notes ?? ""}
                  disabled={!canWrite || templateActionLoading}
                  onChange={(event) => {
                    const nextNotes = event.target.value;
                    setTemplateEditorItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, notes: nextNotes } : row)),
                    );
                  }}
                  placeholder={`Notes for ${dayLabel(item.day_key)} / ${item.slot_key || "slot"}`}
                  className="sm:col-span-4 rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setTemplateEditorItems((current) => [...current, defaultTemplateItem()])}
            disabled={!canWrite || templateActionLoading}
            className="mt-3 rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add template slot
          </button>
        </div>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Instance editor</p>
          <button
            type="button"
            disabled={!authSession || !instance || !canWrite || actionLoading}
            onClick={() => {
              void handleSaveInstance();
            }}
            className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save instance
          </button>
        </div>

        {instanceLoading ? <p className="mt-3 text-sm text-neutral-400">Loading week instance...</p> : null}
        {instanceMessage ? <p className="mt-3 text-sm text-neutral-300">{instanceMessage}</p> : null}
        {actionMessage ? <p className="mt-3 text-sm text-neutral-200">{actionMessage}</p> : null}

        {instance ? (
          <>
            <p className="mt-3 text-xs text-neutral-400">
              Source template snapshot: <span className="text-neutral-200">{instance.template_name_snapshot ?? "Manual"}</span>
            </p>

            <div className="mt-3 rounded border border-neutral-800 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Bulk assignment</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
                <label className="space-y-1 text-xs text-neutral-400">
                  Slot key
                  <input
                    value={bulkSlotKey}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => setBulkSlotKey(event.target.value)}
                    placeholder="breakfast"
                    className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="space-y-1 text-xs text-neutral-400">
                  Dish
                  <select
                    value={bulkDishTemplateId}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => setBulkDishTemplateId(event.target.value)}
                    className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select dish...</option>
                    {bulkSuggestions.length ? (
                      <optgroup label="Suggested for slot">
                        {bulkSuggestions.map((dish) => (
                          <option key={`suggested-${dish.id}`} value={dish.id}>
                            {dish.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    <optgroup label="All dishes">
                      {dishes
                        .filter((dish) => !suggestionIds.has(dish.id))
                        .map((dish) => (
                          <option key={dish.id} value={dish.id}>
                            {dish.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>

                <label className="space-y-1 text-xs text-neutral-400">
                  Scope
                  <select
                    value={bulkScope}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => setBulkScope(event.target.value as BulkScope)}
                    className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="day">One day</option>
                    <option value="selected_days">Selected days</option>
                    <option value="week">Whole week</option>
                  </select>
                </label>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)_auto]">
                {bulkScope === "day" ? (
                  <label className="space-y-1 text-xs text-neutral-400">
                    Day
                    <select
                      value={bulkDay}
                      disabled={!canWrite || actionLoading}
                      onChange={(event) => setBulkDay(event.target.value as DayKey)}
                      className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {DAY_OPTIONS.map((day) => (
                        <option key={day.key} value={day.key}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : bulkScope === "selected_days" ? (
                  <div className="sm:col-span-2 rounded border border-neutral-800 px-2 py-2">
                    <p className="text-xs text-neutral-400">Selected days</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {DAY_OPTIONS.map((day) => (
                        <label key={day.key} className="flex items-center gap-1 text-xs text-neutral-300">
                          <input
                            type="checkbox"
                            checked={bulkSelectedDays.includes(day.key)}
                            disabled={!canWrite || actionLoading}
                            onChange={() => toggleSelectedBulkDay(day.key)}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="sm:col-span-2 self-end text-xs text-neutral-400">Whole week applies to all days.</p>
                )}

                <button
                  type="button"
                  onClick={handleApplyBulkAssignment}
                  disabled={!canWrite || actionLoading}
                  className="self-end rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply bulk assignment
                </button>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="space-y-1 text-xs text-neutral-400">
                  Suggestion filter
                  <input
                    value={bulkSuggestionQuery}
                    onChange={(event) => setBulkSuggestionQuery(event.target.value)}
                    placeholder="Filter dish suggestions..."
                    className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                  />
                </label>
                <div className="self-end text-xs text-neutral-400">
                  {bulkSuggestionsLoading ? "Loading suggestions..." : `${bulkSuggestions.length} suggestion(s)`}
                </div>
              </div>

              {bulkSuggestionsMessage ? <p className="mt-2 text-xs text-neutral-300">{bulkSuggestionsMessage}</p> : null}
            </div>

            <div className="mt-3 space-y-2">
              {draftItems.map((item, index) => (
                <div
                  key={`${item.day_key}-${item.slot_key}-${index}`}
                  className="grid gap-2 rounded border border-neutral-800 p-2 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <select
                    value={item.day_key}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => {
                      const nextDay = event.target.value as DayKey;
                      setDraftItems((current) =>
                        current.map((row, rowIndex) => (rowIndex === index ? { ...row, day_key: nextDay } : row)),
                      );
                    }}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={item.slot_key}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => {
                      const nextSlot = event.target.value;
                      setDraftItems((current) =>
                        current.map((row, rowIndex) => (rowIndex === index ? { ...row, slot_key: nextSlot } : row)),
                      );
                    }}
                    placeholder="slot_key"
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <select
                    value={item.dish_template_id ?? ""}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => {
                      const nextId = event.target.value.trim() ? event.target.value : null;
                      setDraftItems((current) =>
                        current.map((row, rowIndex) => {
                          if (rowIndex !== index) {
                            return row;
                          }
                          return {
                            ...row,
                            dish_template_id: nextId,
                            dish_name: nextId ? dishNameById.get(nextId) ?? null : row.dish_name,
                          };
                        }),
                      );
                    }}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">No dish template</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setDraftItems((current) => (current.length <= 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
                    }}
                    disabled={!canWrite || actionLoading}
                    className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>

                  <input
                    value={item.notes ?? ""}
                    disabled={!canWrite || actionLoading}
                    onChange={(event) => {
                      const nextNotes = event.target.value;
                      setDraftItems((current) =>
                        current.map((row, rowIndex) => (rowIndex === index ? { ...row, notes: nextNotes } : row)),
                      );
                    }}
                    placeholder={`Notes for ${dayLabel(item.day_key)} / ${item.slot_key || "slot"}`}
                    className="sm:col-span-4 rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDraftItems((current) => [...current, defaultInstanceItem()])}
              disabled={!canWrite || actionLoading}
              className="mt-3 rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add slot
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
