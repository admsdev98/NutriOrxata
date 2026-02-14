import { FormEvent, useEffect, useMemo, useState } from "react";

import type { ApiError } from "../../../shared/api/http";
import { loadAuthSession, saveAuthSession, clearAuthSession, type AuthSession } from "../../../shared/auth/workerSession";
import {
  createDishTemplate,
  deleteDishTemplate,
  getDishTemplate,
  listDishTemplates,
  updateDishTemplate,
} from "../api/dishTemplates";
import {
  createIngredient,
  deleteIngredient,
  ingredientUsedBy,
  listIngredients,
  updateIngredient,
} from "../api/ingredients";
import type {
  DishTemplate,
  DishTemplateIn,
  DishTemplateItemIn,
  DishTemplateListItem,
  Ingredient,
  IngredientIn,
  UsedByDishTemplate,
} from "../types";

type Panel = "ingredients" | "dishes";

const DEFAULT_INGREDIENT_FORM: IngredientIn = {
  name: "",
  kcal_per_100g: 0,
  protein_g_per_100g: 0,
  carbs_g_per_100g: 0,
  fat_g_per_100g: 0,
  serving_size_g: null,
};

const DEFAULT_DISH_FORM: DishTemplateIn = {
  name: "",
  items: [{ ingredient_id: "", quantity_g: 100 }],
};

async function loginWorker(email: string, password: string): Promise<AuthSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    const detail = body?.detail ?? `HTTP ${response.status}`;
    const error = new Error(detail) as ApiError;
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  const body = (await response.json()) as { access_token: string; access_mode: "active" | "read_only" };
  return {
    token: body.access_token,
    accessMode: body.access_mode,
    email,
  };
}

function asNumber(raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
}

function computeDishPreview(ingredients: Ingredient[], items: DishTemplateItemIn[]) {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient] as const));
  let kcal = 0;
  let protein_g = 0;
  let carbs_g = 0;
  let fat_g = 0;

  for (const item of items) {
    const ingredient = ingredientById.get(item.ingredient_id);
    if (!ingredient) {
      continue;
    }
    const factor = item.quantity_g / 100;
    kcal += ingredient.kcal_per_100g * factor;
    protein_g += ingredient.protein_g_per_100g * factor;
    carbs_g += ingredient.carbs_g_per_100g * factor;
    fat_g += ingredient.fat_g_per_100g * factor;
  }

  return {
    kcal: Number(kcal.toFixed(2)),
    protein_g: Number(protein_g.toFixed(2)),
    carbs_g: Number(carbs_g.toFixed(2)),
    fat_g: Number(fat_g.toFixed(2)),
  };
}

export default function FoodLibraryPage() {
  const [panel, setPanel] = useState<Panel>("ingredients");

  const [authEmail, setAuthEmail] = useState("s04_test_worker@example.com");
  const [authPassword, setAuthPassword] = useState("TestPass123!");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const canMutate = authSession?.accessMode === "active";

  const [ingredientsQuery, setIngredientsQuery] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsMessage, setIngredientsMessage] = useState<string | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState<IngredientIn>(DEFAULT_INGREDIENT_FORM);
  const [ingredientUsage, setIngredientUsage] = useState<UsedByDishTemplate[] | null>(null);

  const [dishQuery, setDishQuery] = useState("");
  const [dishTemplates, setDishTemplates] = useState<DishTemplateListItem[]>([]);
  const [dishTemplatesLoading, setDishTemplatesLoading] = useState(false);
  const [dishTemplatesMessage, setDishTemplatesMessage] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState<DishTemplateIn>(DEFAULT_DISH_FORM);
  const [dishDetail, setDishDetail] = useState<DishTemplate | null>(null);

  const dishPreview = useMemo(() => computeDishPreview(ingredients, dishForm.items), [ingredients, dishForm.items]);

  useEffect(() => {
    const session = loadAuthSession();
    if (session) {
      setAuthSession(session);
      setAuthEmail(session.email);
    }
  }, []);

  useEffect(() => {
    if (!authSession) {
      return;
    }
    saveAuthSession(authSession);
  }, [authSession]);

  async function reloadIngredients(token: string) {
    setIngredientsLoading(true);
    setIngredientsMessage(null);
    try {
      const rows = await listIngredients(token, ingredientsQuery);
      setIngredients(rows);
    } catch (error) {
      const apiError = error as ApiError;
      setIngredientsMessage(apiError.detail ?? "Failed to load ingredients.");
    } finally {
      setIngredientsLoading(false);
    }
  }

  async function reloadDishTemplates(token: string) {
    setDishTemplatesLoading(true);
    setDishTemplatesMessage(null);
    try {
      const rows = await listDishTemplates(token, dishQuery);
      setDishTemplates(rows);
    } catch (error) {
      const apiError = error as ApiError;
      setDishTemplatesMessage(apiError.detail ?? "Failed to load dish templates.");
    } finally {
      setDishTemplatesLoading(false);
    }
  }

  useEffect(() => {
    if (!authSession) {
      return;
    }
    void reloadIngredients(authSession.token);
  }, [authSession, ingredientsQuery]);

  useEffect(() => {
    if (!authSession) {
      return;
    }
    if (panel !== "dishes") {
      return;
    }
    void reloadDishTemplates(authSession.token);
  }, [authSession, dishQuery, panel]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const session = await loginWorker(authEmail, authPassword);
      setAuthSession(session);
      setIngredientUsage(null);
      setSelectedIngredientId(null);
      setIngredientForm(DEFAULT_INGREDIENT_FORM);
      setSelectedDishId(null);
      setDishForm(DEFAULT_DISH_FORM);
      setDishDetail(null);
      await reloadIngredients(session.token);
      if (panel === "dishes") {
        await reloadDishTemplates(session.token);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setAuthSession(null);
      clearAuthSession();
      setAuthMessage(apiError.detail ?? "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setAuthSession(null);
    clearAuthSession();
  }

  async function handleIngredientSave() {
    if (!authSession) {
      return;
    }
    if (!canMutate) {
      setIngredientsMessage("Token is read_only. Save is blocked by backend.");
      return;
    }

    setIngredientsMessage(null);
    setIngredientUsage(null);

    try {
      if (selectedIngredientId) {
        await updateIngredient(authSession.token, selectedIngredientId, ingredientForm);
      } else {
        await createIngredient(authSession.token, ingredientForm);
      }
      setSelectedIngredientId(null);
      setIngredientForm(DEFAULT_INGREDIENT_FORM);
      await reloadIngredients(authSession.token);
    } catch (error) {
      const apiError = error as ApiError;
      setIngredientsMessage(apiError.detail ?? "Failed to save ingredient.");
    }
  }

  async function handleIngredientDelete(ingredientId: string) {
    if (!authSession) {
      return;
    }
    if (!canMutate) {
      setIngredientsMessage("Token is read_only. Delete is blocked by backend.");
      return;
    }

    setIngredientUsage(null);
    setIngredientsMessage(null);
    try {
      await deleteIngredient(authSession.token, ingredientId);
      if (selectedIngredientId === ingredientId) {
        setSelectedIngredientId(null);
        setIngredientForm(DEFAULT_INGREDIENT_FORM);
      }
      await reloadIngredients(authSession.token);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 409 && apiError.detail === "ingredient_in_use") {
        try {
          const usedBy = await ingredientUsedBy(authSession.token, ingredientId);
          setIngredientUsage(usedBy);
          setIngredientsMessage("Ingredient is used by dish templates. Update those templates before deleting.");
        } catch {
          setIngredientsMessage("Ingredient is used by dish templates.");
        }
      } else {
        setIngredientsMessage(apiError.detail ?? "Failed to delete ingredient.");
      }
    }
  }

  async function handleDishSelect(templateId: string) {
    if (!authSession) {
      return;
    }
    setSelectedDishId(templateId);
    setDishTemplatesMessage(null);
    try {
      const template = await getDishTemplate(authSession.token, templateId);
      setDishDetail(template);
      setDishForm({
        name: template.name,
        items: template.items.map((item) => ({ ingredient_id: item.ingredient_id, quantity_g: item.quantity_g })),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setDishTemplatesMessage(apiError.detail ?? "Failed to load template.");
    }
  }

  async function handleDishSave() {
    if (!authSession) {
      return;
    }
    if (!canMutate) {
      setDishTemplatesMessage("Token is read_only. Save is blocked by backend.");
      return;
    }

    setDishTemplatesMessage(null);
    try {
      const payload: DishTemplateIn = {
        name: dishForm.name,
        items: dishForm.items
          .filter((item) => item.ingredient_id.trim())
          .map((item) => ({ ingredient_id: item.ingredient_id, quantity_g: item.quantity_g })),
      };
      if (!payload.items.length) {
        setDishTemplatesMessage("Add at least one ingredient.");
        return;
      }

      const saved = selectedDishId
        ? await updateDishTemplate(authSession.token, selectedDishId, payload)
        : await createDishTemplate(authSession.token, payload);

      setSelectedDishId(saved.id);
      setDishDetail(saved);
      await reloadDishTemplates(authSession.token);
    } catch (error) {
      const apiError = error as ApiError;
      setDishTemplatesMessage(apiError.detail ?? "Failed to save dish template.");
    }
  }

  async function handleDishDelete(templateId: string) {
    if (!authSession) {
      return;
    }
    if (!canMutate) {
      setDishTemplatesMessage("Token is read_only. Delete is blocked by backend.");
      return;
    }

    setDishTemplatesMessage(null);
    try {
      await deleteDishTemplate(authSession.token, templateId);
      if (selectedDishId === templateId) {
        setSelectedDishId(null);
        setDishForm(DEFAULT_DISH_FORM);
        setDishDetail(null);
      }
      await reloadDishTemplates(authSession.token);
    } catch (error) {
      const apiError = error as ApiError;
      setDishTemplatesMessage(apiError.detail ?? "Failed to delete dish template.");
    }
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Food library</h1>
        <p className="text-neutral-300">Tenant-scoped ingredients and dish templates for fast planning.</p>
      </header>

      <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Auth dev panel</p>

        {authSession ? (
          <div className="mt-2 space-y-2 text-sm">
            <p className="text-neutral-200">
              Logged as <span className="font-medium">{authSession.email}</span>
            </p>
            <p className="text-neutral-300">
              Access mode from token: <span className="font-medium">{authSession.accessMode}</span>
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-800"
            >
              Logout
            </button>
          </div>
        ) : (
          <form className="mt-2 grid gap-2 sm:grid-cols-2" onSubmit={handleLoginSubmit}>
            <label className="space-y-1 text-xs text-neutral-400">
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
              />
            </label>
            <label className="space-y-1 text-xs text-neutral-400">
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={authLoading}
                className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        )}

        {authMessage ? <p className="mt-2 text-xs text-amber-300">{authMessage}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanel("ingredients")}
          className={`rounded border px-3 py-2 text-xs uppercase tracking-wide ${
            panel === "ingredients"
              ? "border-neutral-500 bg-neutral-800 text-neutral-100"
              : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500"
          }`}
        >
          Ingredients
        </button>
        <button
          type="button"
          onClick={() => setPanel("dishes")}
          className={`rounded border px-3 py-2 text-xs uppercase tracking-wide ${
            panel === "dishes"
              ? "border-neutral-500 bg-neutral-800 text-neutral-100"
              : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500"
          }`}
        >
          Dish templates
        </button>
      </div>

      {panel === "ingredients" ? (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded border border-neutral-800 bg-neutral-900 p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-300">Ingredients</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedIngredientId(null);
                  setIngredientForm(DEFAULT_INGREDIENT_FORM);
                  setIngredientUsage(null);
                }}
                className="rounded border border-neutral-700 px-2 py-1 text-[11px] hover:bg-neutral-800"
              >
                New
              </button>
            </div>

            <input
              value={ingredientsQuery}
              onChange={(event) => setIngredientsQuery(event.target.value)}
              placeholder="Search..."
              className="mt-3 w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
            />

            {ingredientsLoading ? <p className="mt-3 text-sm text-neutral-400">Loading...</p> : null}
            {ingredientsMessage ? <p className="mt-3 text-sm text-neutral-300">{ingredientsMessage}</p> : null}

            <ul className="mt-3 space-y-2">
              {ingredients.map((ingredient) => {
                const isSelected = ingredient.id === selectedIngredientId;
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIngredientId(ingredient.id);
                        setIngredientUsage(null);
                        setIngredientForm({
                          name: ingredient.name,
                          kcal_per_100g: ingredient.kcal_per_100g,
                          protein_g_per_100g: ingredient.protein_g_per_100g,
                          carbs_g_per_100g: ingredient.carbs_g_per_100g,
                          fat_g_per_100g: ingredient.fat_g_per_100g,
                          serving_size_g: ingredient.serving_size_g,
                        });
                      }}
                      className={`w-full rounded border px-3 py-2 text-left text-sm ${
                        isSelected ? "border-neutral-500 bg-neutral-800" : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
                      }`}
                    >
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="mt-1 text-xs text-neutral-400">kcal/100g: {ingredient.kcal_per_100g}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-300">Editor</h2>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-neutral-400 sm:col-span-2">
                Name
                <input
                  value={ingredientForm.name}
                  onChange={(event) => setIngredientForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-400">
                kcal / 100g
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ingredientForm.kcal_per_100g}
                  onChange={(event) =>
                    setIngredientForm((prev) => ({ ...prev, kcal_per_100g: asNumber(event.target.value) }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-400">
                Protein g / 100g
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ingredientForm.protein_g_per_100g}
                  onChange={(event) =>
                    setIngredientForm((prev) => ({ ...prev, protein_g_per_100g: asNumber(event.target.value) }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-400">
                Carbs g / 100g
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ingredientForm.carbs_g_per_100g}
                  onChange={(event) =>
                    setIngredientForm((prev) => ({ ...prev, carbs_g_per_100g: asNumber(event.target.value) }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-400">
                Fat g / 100g
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ingredientForm.fat_g_per_100g}
                  onChange={(event) => setIngredientForm((prev) => ({ ...prev, fat_g_per_100g: asNumber(event.target.value) }))}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-400 sm:col-span-2">
                Serving size (g, optional)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ingredientForm.serving_size_g ?? ""}
                  onChange={(event) =>
                    setIngredientForm((prev) => ({
                      ...prev,
                      serving_size_g: event.target.value.trim() ? asNumber(event.target.value) : null,
                    }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!authSession || !canMutate}
                onClick={() => {
                  void handleIngredientSave();
                }}
                className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedIngredientId ? "Save changes" : "Create ingredient"}
              </button>

              {selectedIngredientId ? (
                <button
                  type="button"
                  disabled={!authSession || !canMutate}
                  onClick={() => {
                    if (window.confirm("Delete ingredient?")) {
                      void handleIngredientDelete(selectedIngredientId);
                    }
                  }}
                  className="rounded border border-red-900/60 px-3 py-2 text-xs text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {ingredientUsage?.length ? (
              <div className="mt-4 rounded border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
                <p className="font-medium">Used by dish templates</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                  {ingredientUsage.map((row) => (
                    <li key={row.id}>{row.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded border border-neutral-800 bg-neutral-900 p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-300">Dish templates</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedDishId(null);
                  setDishForm(DEFAULT_DISH_FORM);
                  setDishDetail(null);
                }}
                className="rounded border border-neutral-700 px-2 py-1 text-[11px] hover:bg-neutral-800"
              >
                New
              </button>
            </div>

            <input
              value={dishQuery}
              onChange={(event) => setDishQuery(event.target.value)}
              placeholder="Search..."
              className="mt-3 w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
            />

            {dishTemplatesLoading ? <p className="mt-3 text-sm text-neutral-400">Loading...</p> : null}
            {dishTemplatesMessage ? <p className="mt-3 text-sm text-neutral-300">{dishTemplatesMessage}</p> : null}

            <ul className="mt-3 space-y-2">
              {dishTemplates.map((template) => {
                const isSelected = template.id === selectedDishId;
                return (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDishSelect(template.id);
                      }}
                      className={`w-full rounded border px-3 py-2 text-left text-sm ${
                        isSelected ? "border-neutral-500 bg-neutral-800" : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
                      }`}
                    >
                      <p className="font-medium">{template.name}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-300">Editor</h2>

            <label className="mt-3 block space-y-1 text-xs text-neutral-400">
              Name
              <input
                value={dishForm.name}
                onChange={(event) => setDishForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Items</p>
              {dishForm.items.map((item, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                  <select
                    value={item.ingredient_id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setDishForm((prev) => ({
                        ...prev,
                        items: prev.items.map((row, rowIdx) => (rowIdx === idx ? { ...row, ingredient_id: nextId } : row)),
                      }));
                    }}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                  >
                    <option value="">Select ingredient...</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.quantity_g}
                    onChange={(event) => {
                      const nextQty = asNumber(event.target.value);
                      setDishForm((prev) => ({
                        ...prev,
                        items: prev.items.map((row, rowIdx) => (rowIdx === idx ? { ...row, quantity_g: nextQty } : row)),
                      }));
                    }}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setDishForm((prev) => ({
                        ...prev,
                        items: prev.items.length === 1 ? prev.items : prev.items.filter((_, rowIdx) => rowIdx !== idx),
                      }));
                    }}
                    className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-800"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setDishForm((prev) => ({ ...prev, items: [...prev.items, { ingredient_id: "", quantity_g: 100 }] }));
                }}
                className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-800"
              >
                Add ingredient
              </button>
            </div>

            <div className="mt-4 rounded border border-neutral-800 bg-neutral-950 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Preview totals</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p>kcal: {dishPreview.kcal}</p>
                <p>protein_g: {dishPreview.protein_g}</p>
                <p>carbs_g: {dishPreview.carbs_g}</p>
                <p>fat_g: {dishPreview.fat_g}</p>
              </div>
              {dishDetail ? (
                <p className="mt-2 text-xs text-neutral-400">Backend totals: kcal {dishDetail.totals.kcal}</p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!authSession || !canMutate}
                onClick={() => {
                  void handleDishSave();
                }}
                className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedDishId ? "Save changes" : "Create template"}
              </button>

              {selectedDishId ? (
                <button
                  type="button"
                  disabled={!authSession || !canMutate}
                  onClick={() => {
                    if (window.confirm("Delete dish template?")) {
                      void handleDishDelete(selectedDishId);
                    }
                  }}
                  className="rounded border border-red-900/60 px-3 py-2 text-xs text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
