import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";

import { getWorkerClients, type WorkerClientsScenario } from "../api/getWorkerClients";
import type { WorkerClient } from "../data/mockClients";

type ClientsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; clients: WorkerClient[] };

type WorkerTab = {
  id: "nutrition" | "weekly-plan" | "training" | "messaging" | "progress";
  label: string;
  description: string;
};

type WorkerAccessMode = "active" | "read_only" | "blocked";
type ApiAccessMode = "active" | "read_only";

type AuthSession = {
  token: string;
  accessMode: ApiAccessMode;
  email: string;
};

type NutritionProfileForm = {
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

type NutritionProfileApi = {
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

type NutritionTargetsApi = {
  daily: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  weekly: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  warnings: string[];
};

type ApiError = Error & {
  status?: number;
  detail?: string;
};

const WORKER_TABS: WorkerTab[] = [
  {
    id: "nutrition",
    label: "Nutrition",
    description: "Nutrition targets and daily intake review.",
  },
  {
    id: "weekly-plan",
    label: "Weekly plan",
    description: "Weekly plan structure and day assignment.",
  },
  {
    id: "training",
    label: "Training",
    description: "Routine assignment and quick workout notes.",
  },
  {
    id: "messaging",
    label: "Messaging",
    description: "Coach-client communication timeline.",
  },
  {
    id: "progress",
    label: "Progress",
    description: "Adherence and outcome follow-up.",
  },
];

const AUTH_STORAGE_KEY = "worker-auth-session";

const DEFAULT_PROFILE_FORM: NutritionProfileForm = {
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

function readScenario(searchParams: URLSearchParams): WorkerClientsScenario {
  const demoParam = searchParams.get("demo");
  if (demoParam === "empty") {
    return "empty";
  }
  if (demoParam === "error") {
    return "error";
  }
  return "default";
}

function isKnownTab(tabId: string | null): tabId is WorkerTab["id"] {
  if (!tabId) {
    return false;
  }
  return WORKER_TABS.some((tab) => tab.id === tabId);
}

function readAccessMode(searchParams: URLSearchParams): WorkerAccessMode {
  const modeParam = searchParams.get("mode");
  if (modeParam === "read_only") {
    return "read_only";
  }
  if (modeParam === "blocked") {
    return "blocked";
  }
  return "active";
}

function isDebugMode(searchParams: URLSearchParams): boolean {
  return searchParams.get("debug") === "1";
}

function updateSearchWithTab(searchParams: URLSearchParams, tabId: WorkerTab["id"]): string {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", tabId);
  return `?${nextParams.toString()}`;
}

function updateSearchWithMode(searchParams: URLSearchParams, mode: WorkerAccessMode): string {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("mode", mode);
  return `?${nextParams.toString()}`;
}

function updateSearchWithDebug(searchParams: URLSearchParams, enabled: boolean): string {
  const nextParams = new URLSearchParams(searchParams);
  if (enabled) {
    nextParams.set("debug", "1");
  } else {
    nextParams.delete("debug");
  }
  return `?${nextParams.toString()}`;
}

function searchSuffix(searchParams: URLSearchParams): string {
  const raw = searchParams.toString();
  return raw ? `?${raw}` : "";
}

function statusLabel(client: WorkerClient): string {
  if (client.planStatus === "attention") {
    return "Needs attention";
  }
  return "On track";
}

function statusClasses(client: WorkerClient): string {
  if (client.planStatus === "attention") {
    return "border border-amber-800 bg-amber-950 text-amber-300";
  }
  return "border border-emerald-800 bg-emerald-950 text-emerald-300";
}

function accessModeLabel(mode: WorkerAccessMode): string {
  if (mode === "read_only") {
    return "Read-only mode";
  }
  if (mode === "blocked") {
    return "Blocked mode";
  }
  return "Active mode";
}

function accessModeClasses(mode: WorkerAccessMode): string {
  if (mode === "read_only") {
    return "border-amber-800 bg-amber-950/40 text-amber-200";
  }
  if (mode === "blocked") {
    return "border-red-900 bg-red-950/40 text-red-200";
  }
  return "border-emerald-800 bg-emerald-950/40 text-emerald-200";
}

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

function buildProfilePayload(form: NutritionProfileForm): NutritionProfileApi {
  const heightCm = Number(form.heightCm);
  const weightKg = Number(form.weightKg);

  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error("invalid_height_cm");
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("invalid_weight_kg");
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

function profileToForm(profile: NutritionProfileApi): NutritionProfileForm {
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

async function parseApiError(response: Response): Promise<ApiError> {
  let detail = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body?.detail) {
      detail = body.detail;
    }
  } catch {
    // ignored
  }
  const error = new Error(detail) as ApiError;
  error.status = response.status;
  error.detail = detail;
  return error;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as T;
}

async function apiPut<T>(path: string, token: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as T;
}

type NutritionTabProps = {
  selectedClientName: string;
  authSession: AuthSession | null;
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  authMessage: string | null;
  profileForm: NutritionProfileForm;
  profileStatus: "idle" | "loading" | "missing" | "ready" | "saving" | "error";
  profileMessage: string | null;
  targets: NutritionTargetsApi | null;
  targetsMessage: string | null;
  targetsLoading: boolean;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onProfileInputChange: (field: keyof NutritionProfileForm, value: string) => void;
  onSaveProfile: () => void;
  onReloadProfile: () => void;
  onReloadTargets: () => void;
};

function NutritionTabPanel(props: NutritionTabProps) {
  const canSave = Boolean(props.authSession && props.authSession.accessMode === "active");

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Nutrition scope</p>
        <p className="mt-2 text-sm text-neutral-200">
          The selected client ({props.selectedClientName}) is visual shell context. Current S04 backend works with
          <code className="ml-1 rounded bg-neutral-900 px-1 py-0.5">/api/nutrition/*/me</code>, so this tab edits the
          logged-in user profile.
        </p>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Auth dev panel</p>

        {props.authSession ? (
          <div className="mt-2 space-y-2 text-sm">
            <p className="text-neutral-200">
              Logged as <span className="font-medium">{props.authSession.email}</span>
            </p>
            <p className="text-neutral-300">
              Access mode from token: <span className="font-medium">{props.authSession.accessMode}</span>
            </p>
            <button
              type="button"
              onClick={props.onLogout}
              className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-900"
            >
              Logout
            </button>
          </div>
        ) : (
          <form className="mt-2 grid gap-2 sm:grid-cols-2" onSubmit={props.onLoginSubmit}>
            <label className="space-y-1 text-xs text-neutral-400">
              Email
              <input
                type="email"
                value={props.authEmail}
                onChange={(event) => props.onAuthEmailChange(event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>
            <label className="space-y-1 text-xs text-neutral-400">
              Password
              <input
                type="password"
                value={props.authPassword}
                onChange={(event) => props.onAuthPasswordChange(event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={props.authLoading}
                className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {props.authLoading ? "Logging in..." : "Login and load nutrition"}
              </button>
            </div>
          </form>
        )}

        {props.authMessage ? <p className="mt-2 text-xs text-amber-300">{props.authMessage}</p> : null}
      </div>

      {props.authSession ? (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Nutrition profile</p>
            <button
              type="button"
              onClick={props.onReloadProfile}
              className="rounded border border-neutral-700 px-2 py-1 text-[11px] hover:bg-neutral-900"
            >
              Reload
            </button>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-neutral-400">
              Sex
              <select
                value={props.profileForm.sex}
                onChange={(event) => props.onProfileInputChange("sex", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              >
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Birth date
              <input
                type="date"
                value={props.profileForm.birthDate}
                onChange={(event) => props.onProfileInputChange("birthDate", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Height (cm)
              <input
                type="number"
                value={props.profileForm.heightCm}
                onChange={(event) => props.onProfileInputChange("heightCm", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                value={props.profileForm.weightKg}
                onChange={(event) => props.onProfileInputChange("weightKg", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Activity level
              <select
                value={props.profileForm.activityLevel}
                onChange={(event) => props.onProfileInputChange("activityLevel", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              >
                <option value="sedentary">sedentary</option>
                <option value="light">light</option>
                <option value="moderate">moderate</option>
                <option value="very_active">very_active</option>
                <option value="athlete">athlete</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Goal
              <select
                value={props.profileForm.goal}
                onChange={(event) => props.onProfileInputChange("goal", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              >
                <option value="maintain">maintain</option>
                <option value="cut">cut</option>
                <option value="bulk">bulk</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Override kcal
              <input
                type="number"
                value={props.profileForm.overrideKcal}
                onChange={(event) => props.onProfileInputChange("overrideKcal", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Override protein (g)
              <input
                type="number"
                value={props.profileForm.overrideProteinG}
                onChange={(event) => props.onProfileInputChange("overrideProteinG", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Override carbs (g)
              <input
                type="number"
                value={props.profileForm.overrideCarbsG}
                onChange={(event) => props.onProfileInputChange("overrideCarbsG", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>

            <label className="space-y-1 text-xs text-neutral-400">
              Override fat (g)
              <input
                type="number"
                value={props.profileForm.overrideFatG}
                onChange={(event) => props.onProfileInputChange("overrideFatG", event.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSave || props.profileStatus === "saving"}
              onClick={props.onSaveProfile}
              className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {props.profileStatus === "saving" ? "Saving..." : "Save profile"}
            </button>
            <button
              type="button"
              onClick={props.onReloadTargets}
              className="rounded border border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-900"
            >
              Refresh targets
            </button>
          </div>

          {props.profileStatus === "missing" ? (
            <p className="mt-2 text-xs text-amber-300">No profile found yet. Fill the form and save.</p>
          ) : null}
          {props.authSession.accessMode === "read_only" ? (
            <p className="mt-2 text-xs text-amber-300">Token is read_only. Save is blocked by backend.</p>
          ) : null}
          {props.profileStatus === "loading" ? <p className="mt-2 text-xs text-neutral-400">Loading profile...</p> : null}
          {props.profileMessage ? <p className="mt-2 text-xs text-neutral-300">{props.profileMessage}</p> : null}
        </div>
      ) : null}

      {props.authSession ? (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Calculated targets</p>
          {props.targetsLoading ? <p className="mt-2 text-sm text-neutral-300">Loading targets...</p> : null}
          {props.targetsMessage ? <p className="mt-2 text-sm text-neutral-300">{props.targetsMessage}</p> : null}

          {props.targets ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-neutral-800 bg-neutral-900 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-neutral-400">Daily</p>
                <p>kcal: {props.targets.daily.kcal}</p>
                <p>protein_g: {props.targets.daily.protein_g}</p>
                <p>carbs_g: {props.targets.daily.carbs_g}</p>
                <p>fat_g: {props.targets.daily.fat_g}</p>
              </div>
              <div className="rounded border border-neutral-800 bg-neutral-900 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-neutral-400">Weekly</p>
                <p>kcal: {props.targets.weekly.kcal}</p>
                <p>protein_g: {props.targets.weekly.protein_g}</p>
                <p>carbs_g: {props.targets.weekly.carbs_g}</p>
                <p>fat_g: {props.targets.weekly.fat_g}</p>
              </div>
            </div>
          ) : null}

          {props.targets?.warnings?.length ? (
            <ul className="mt-2 rounded border border-amber-800 bg-amber-950/40 p-2 text-xs text-amber-200">
              {props.targets.warnings.map((warning) => (
                <li key={warning}>warning: {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function WorkerWorkspacePage() {
  const params = useParams<{ clientId?: string }>();
  const [searchParams] = useSearchParams();
  const [reloadToken, setReloadToken] = useState(0);
  const [clientsState, setClientsState] = useState<ClientsState>({ status: "loading" });

  const [authEmail, setAuthEmail] = useState("s04_test_worker@example.com");
  const [authPassword, setAuthPassword] = useState("TestPass123!");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<NutritionProfileForm>(DEFAULT_PROFILE_FORM);
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "missing" | "ready" | "saving" | "error">(
    "idle",
  );
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [targets, setTargets] = useState<NutritionTargetsApi | null>(null);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsMessage, setTargetsMessage] = useState<string | null>(null);

  const scenario = useMemo(() => readScenario(searchParams), [searchParams]);
  const accessMode = useMemo(() => readAccessMode(searchParams), [searchParams]);
  const debugMode = useMemo(() => isDebugMode(searchParams), [searchParams]);
  const rawTab = searchParams.get("tab");
  const activeTabId: WorkerTab["id"] = isKnownTab(rawTab) ? rawTab : "nutrition";
  const activeTab = WORKER_TABS.find((tab) => tab.id === activeTabId) ?? WORKER_TABS[0];

  useEffect(() => {
    let cancelled = false;

    setClientsState({ status: "loading" });

    (async () => {
      try {
        const clients = await getWorkerClients(scenario);
        if (!cancelled) {
          setClientsState({ status: "ready", clients });
        }
      } catch (error) {
        if (!cancelled) {
          setClientsState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load clients",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, scenario]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed.token && (parsed.accessMode === "active" || parsed.accessMode === "read_only")) {
        setAuthSession(parsed);
        if (parsed.email) {
          setAuthEmail(parsed.email);
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!authSession) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authSession));
  }, [authSession]);

  async function loadProfile(token: string): Promise<void> {
    setProfileStatus("loading");
    setProfileMessage(null);

    try {
      const profile = await apiGet<NutritionProfileApi>("/api/nutrition/profile/me", token);
      setProfileForm(profileToForm(profile));
      setProfileStatus("ready");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        setProfileStatus("missing");
        setProfileForm(DEFAULT_PROFILE_FORM);
        setProfileMessage("Profile is empty for this user.");
        return;
      }
      setProfileStatus("error");
      setProfileMessage(apiError.detail ?? "Failed to load nutrition profile.");
    }
  }

  async function loadTargets(token: string): Promise<void> {
    setTargetsLoading(true);
    setTargetsMessage(null);

    try {
      const response = await apiGet<NutritionTargetsApi>("/api/nutrition/targets/me", token);
      setTargets(response);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        setTargets(null);
        setTargetsMessage("Targets unavailable until a nutrition profile exists.");
      } else {
        setTargets(null);
        setTargetsMessage(apiError.detail ?? "Failed to load targets.");
      }
    } finally {
      setTargetsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTabId !== "nutrition") {
      return;
    }
    if (!authSession) {
      return;
    }

    void loadProfile(authSession.token);
    void loadTargets(authSession.token);
  }, [activeTabId, authSession]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!response.ok) {
        throw await parseApiError(response);
      }

      const payload = (await response.json()) as { access_token: string; access_mode: ApiAccessMode };
      const nextSession: AuthSession = {
        token: payload.access_token,
        accessMode: payload.access_mode,
        email: authEmail,
      };
      setAuthSession(nextSession);
      setAuthMessage(`Login OK (${payload.access_mode}).`);
    } catch (error) {
      const apiError = error as ApiError;
      setAuthSession(null);
      setAuthMessage(apiError.detail ?? "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setAuthSession(null);
    setAuthMessage("Session cleared.");
    setProfileStatus("idle");
    setProfileMessage(null);
    setTargets(null);
    setTargetsMessage(null);
  }

  function handleProfileInputChange(field: keyof NutritionProfileForm, value: string) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveProfile() {
    if (!authSession) {
      setProfileMessage("Login is required.");
      return;
    }
    if (authSession.accessMode !== "active") {
      setProfileMessage("Token is read_only. Save is blocked.");
      return;
    }

    setProfileStatus("saving");
    setProfileMessage(null);

    try {
      const payload = buildProfilePayload(profileForm);
      const response = await apiPut<NutritionProfileApi>("/api/nutrition/profile/me", authSession.token, payload);
      setProfileForm(profileToForm(response));
      setProfileStatus("ready");
      setProfileMessage("Profile saved.");
      await loadTargets(authSession.token);
    } catch (error) {
      const apiError = error as ApiError;
      setProfileStatus("error");
      setProfileMessage(apiError.detail ?? "Failed to save nutrition profile.");
    }
  }

  async function handleReloadProfile() {
    if (!authSession) {
      setProfileMessage("Login is required.");
      return;
    }
    await loadProfile(authSession.token);
  }

  async function handleReloadTargets() {
    if (!authSession) {
      setTargetsMessage("Login is required.");
      return;
    }
    await loadTargets(authSession.token);
  }

  if (clientsState.status === "loading") {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Worker workspace</h1>
          <p className="text-neutral-300">Loading clients...</p>
        </header>
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">Preparing workspace data.</p>
        </div>
      </section>
    );
  }

  if (clientsState.status === "error") {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Worker workspace</h1>
          <p className="text-neutral-300">There was an issue loading clients.</p>
        </header>
        <div className="space-y-3 rounded border border-red-900 bg-red-950/40 p-4">
          <p className="text-sm text-red-200">Error: {clientsState.message}</p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800"
          >
            Retry loading
          </button>
        </div>
      </section>
    );
  }

  const clients = clientsState.clients;

  if (clients.length === 0) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Worker workspace</h1>
          <p className="text-neutral-300">No clients available yet.</p>
        </header>
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">Create or invite the first client to begin planning.</p>
        </div>
      </section>
    );
  }

  const firstClient = clients[0];

  if (!params.clientId && firstClient) {
    return <Navigate to={`/worker/clients/${firstClient.id}${searchSuffix(searchParams)}`} replace />;
  }

  const selectedClient = clients.find((client) => client.id === params.clientId);

  if (!selectedClient) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Worker workspace</h1>
          <p className="text-neutral-300">The selected client does not exist.</p>
        </header>
        <div className="space-y-2 rounded border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">Select a valid client from the list.</p>
          <Link
            to={`/worker/clients/${firstClient.id}${searchSuffix(searchParams)}`}
            className="inline-block rounded border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
          >
            Open first client
          </Link>
        </div>
      </section>
    );
  }

  if (accessMode === "blocked") {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Worker workspace</h1>
          <p className="text-neutral-300">Access state is explicit and server-driven.</p>
        </header>

        <div className={`rounded border p-3 text-sm ${accessModeClasses(accessMode)}`}>
          <p className="font-medium">{accessModeLabel(accessMode)}</p>
          <p className="mt-1">Tenant is blocked. Workspace actions are unavailable.</p>
        </div>

        <div className="space-y-2 rounded border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">Please resolve access state before continuing.</p>
          <Link
            to={`/worker/clients/${selectedClient.id}${updateSearchWithMode(searchParams, "active")}`}
            className="inline-block rounded border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
          >
            Return to active view
          </Link>
        </div>
      </section>
    );
  }

  const canMutate = accessMode === "active";

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Worker workspace</h1>
        <p className="text-neutral-300">Common actions should stay within 2-3 clicks.</p>
      </header>

      <div className={`rounded border p-3 text-sm ${accessModeClasses(accessMode)}`}>
        <p className="font-medium">{accessModeLabel(accessMode)}</p>
        {accessMode === "read_only" ? (
          <p className="mt-1">Mutating actions are disabled, but navigation and review remain available.</p>
        ) : (
          <p className="mt-1">All workspace actions are currently enabled.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded border border-neutral-800 bg-neutral-900 p-3">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-300">Clients</h2>
          <ul className="space-y-2">
            {clients.map((client) => {
              const isSelected = client.id === selectedClient.id;
              return (
                <li key={client.id}>
                  <Link
                    to={`/worker/clients/${client.id}${searchSuffix(searchParams)}`}
                    className={`block rounded border px-3 py-2 transition ${
                      isSelected
                        ? "border-neutral-500 bg-neutral-800"
                        : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
                    }`}
                  >
                    <p className="text-sm font-medium">{client.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-400">Last check-in: {client.lastCheckInLabel}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="rounded border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{selectedClient.fullName}</h2>
            <span className={`rounded px-2 py-1 text-xs ${statusClasses(selectedClient)}`}>{statusLabel(selectedClient)}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {WORKER_TABS.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <Link
                  key={tab.id}
                  to={{
                    pathname: `/worker/clients/${selectedClient.id}`,
                    search: updateSearchWithTab(searchParams, tab.id),
                  }}
                  className={`rounded border px-3 py-1.5 text-xs uppercase tracking-wide ${
                    isActive
                      ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                      : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {activeTab.id === "nutrition" ? (
            <NutritionTabPanel
              selectedClientName={selectedClient.fullName}
              authSession={authSession}
              authEmail={authEmail}
              authPassword={authPassword}
              authLoading={authLoading}
              authMessage={authMessage}
              profileForm={profileForm}
              profileStatus={profileStatus}
              profileMessage={profileMessage}
              targets={targets}
              targetsMessage={targetsMessage}
              targetsLoading={targetsLoading}
              onAuthEmailChange={setAuthEmail}
              onAuthPasswordChange={setAuthPassword}
              onLoginSubmit={handleLoginSubmit}
              onLogout={handleLogout}
              onProfileInputChange={handleProfileInputChange}
              onSaveProfile={handleSaveProfile}
              onReloadProfile={() => {
                void handleReloadProfile();
              }}
              onReloadTargets={() => {
                void handleReloadTargets();
              }}
            />
          ) : (
            <div className="mt-4 rounded border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">{activeTab.label}</p>
              <p className="mt-1 text-sm text-neutral-200">{activeTab.description}</p>
              <p className="mt-2 text-xs text-neutral-400">Placeholder module. Functional implementation arrives in S05-S09.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canMutate}
                  className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save tab draft
                </button>
                <button
                  type="button"
                  disabled={!canMutate}
                  className="rounded border border-neutral-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send adjustment
                </button>
              </div>
            </div>
          )}

          {debugMode ? (
            <div className="mt-4 rounded border border-dashed border-neutral-700 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Demo controls</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Link to={`/worker/clients/${selectedClient.id}?tab=${activeTab.id}&debug=1`} className="underline">
                  Default
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}?tab=${activeTab.id}&demo=empty&debug=1`}
                  className="underline"
                >
                  Empty state
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}?tab=${activeTab.id}&demo=error&debug=1`}
                  className="underline"
                >
                  Error state
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}${updateSearchWithMode(searchParams, "active")}`}
                  className="underline"
                >
                  Active mode
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}${updateSearchWithMode(searchParams, "read_only")}`}
                  className="underline"
                >
                  Read-only mode
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}${updateSearchWithMode(searchParams, "blocked")}`}
                  className="underline"
                >
                  Blocked mode
                </Link>
                <Link
                  to={`/worker/clients/${selectedClient.id}${updateSearchWithDebug(searchParams, false)}`}
                  className="underline"
                >
                  Hide debug panel
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
