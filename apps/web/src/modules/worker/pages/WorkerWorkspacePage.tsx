import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";

import { NutritionTabPanel } from "../../nutrition/components/NutritionTabPanel";
import { buildProfilePayload, profileToForm } from "../../nutrition/profileMapping";
import {
  DEFAULT_PROFILE_FORM,
  type NutritionProfileApi,
  type NutritionProfileForm,
  type NutritionTargetsApi,
} from "../../nutrition/types";
import { getWorkerClients, type WorkerClientsScenario } from "../api/getWorkerClients";
import type { WorkerClient } from "../data/mockClients";
import { apiGet, apiPut, parseApiError, type ApiError } from "../../../shared/api/http";

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
