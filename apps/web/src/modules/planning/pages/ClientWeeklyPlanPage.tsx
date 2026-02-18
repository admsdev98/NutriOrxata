import { FormEvent, useMemo, useState } from "react";

import { parseApiError, type ApiError } from "../../../shared/api/http";
import { getWeekPlanInstanceByClientWeek } from "../api/weekPlanning";
import type { DayKey, WeekPlanInstance, WeekPlanInstanceItem } from "../types";
import { DAY_OPTIONS } from "../types";

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

function todayDayKey(): DayKey {
  const day = new Date().getDay();
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  if (day === 6) return "sat";
  return "sun";
}

export default function ClientWeeklyPlanPage() {
  const [email, setEmail] = useState("s04_test_worker@example.com");
  const [password, setPassword] = useState("TestPass123!");
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [clientRef, setClientRef] = useState("c-001");
  const [weekStartDate, setWeekStartDate] = useState(() => startOfWeekIso(new Date()));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [instance, setInstance] = useState<WeekPlanInstance | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    if (!instance || !selectedSlotId) {
      return null;
    }
    return instance.items.find((item) => item.id === selectedSlotId) ?? null;
  }, [instance, selectedSlotId]);

  const days = useMemo(() => {
    const currentDay = todayDayKey();
    return DAY_OPTIONS.map((day) => {
      const items = instance?.items.filter((item) => item.day_key === day.key) ?? [];
      return {
        ...day,
        items,
        isToday: day.key === currentDay,
      };
    }).filter((day) => day.items.length > 0);
  }, [instance]);

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
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw await parseApiError(response);
      }
      const payload = (await response.json()) as { access_token: string; access_mode: "active" | "read_only" };
      setToken(payload.access_token);
      setAuthMessage(`Login OK (${payload.access_mode}).`);
    } catch (error) {
      const apiError = error as ApiError;
      setToken("");
      setAuthMessage(apiError.detail ?? "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLoadPlan() {
    if (!token.trim()) {
      setMessage("Access token is required.");
      return;
    }
    if (!clientRef.trim()) {
      setMessage("Client reference is required.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await getWeekPlanInstanceByClientWeek(token.trim(), clientRef.trim(), weekStartDate);
      setInstance(response);
      setSelectedSlotId(response.items[0]?.id ?? null);
    } catch (error) {
      const apiError = error as ApiError;
      setInstance(null);
      setSelectedSlotId(null);
      if (apiError.status === 404) {
        setMessage("No assigned week plan for this client and week.");
      } else {
        setMessage(apiError.detail ?? "Failed to load weekly plan.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Client weekly plan</h1>
        <p className="text-neutral-300">Read-only surface for assigned weekly slots and dish details.</p>
      </header>

      <form onSubmit={handleLoginSubmit} className="rounded border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Access</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
          />
          <button
            type="submit"
            disabled={authLoading}
            className="rounded border border-neutral-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {authLoading ? "Logging in..." : "Login"}
          </button>
        </div>

        <label className="mt-2 block space-y-1 text-xs text-neutral-400">
          Access token
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste token if needed"
            className="block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
          />
        </label>

        {authMessage ? <p className="mt-2 text-sm text-neutral-300">{authMessage}</p> : null}
      </form>

      <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Weekly plan lookup</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <input
            value={clientRef}
            onChange={(event) => setClientRef(event.target.value)}
            placeholder="client_ref"
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
          />
          <input
            type="date"
            value={weekStartDate}
            onChange={(event) => setWeekStartDate(event.target.value)}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-100"
          />
          <button
            type="button"
            onClick={() => {
              void handleLoadPlan();
            }}
            disabled={loading}
            className="rounded border border-neutral-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load plan"}
          </button>
        </div>

        {message ? <p className="mt-2 text-sm text-neutral-300">{message}</p> : null}
      </div>

      {instance ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Assigned slots</p>
            <p className="mt-1 text-sm text-neutral-300">
              Week of {instance.week_start_date} {instance.template_name_snapshot ? `- ${instance.template_name_snapshot}` : ""}
            </p>

            <div className="mt-3 space-y-3">
              {days.map((day) => (
                <div key={day.key} className="rounded border border-neutral-800 p-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{day.label}</p>
                    {day.isToday ? <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs text-emerald-200">Today</span> : null}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {day.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSlotId(item.id)}
                          className={`w-full rounded border px-2 py-1 text-left text-sm ${
                            selectedSlotId === item.id
                              ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                              : "border-neutral-700 bg-neutral-950 text-neutral-300"
                          }`}
                        >
                          {item.slot_key}: {item.dish_name ?? "No dish assigned"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Slot detail</p>
            {selectedItem ? (
              <SlotDetail item={selectedItem} />
            ) : (
              <p className="mt-2 text-sm text-neutral-300">Select a slot to inspect dish details.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SlotDetail({ item }: { item: WeekPlanInstanceItem }) {
  return (
    <div className="mt-2 space-y-2 text-sm text-neutral-200">
      <p>
        <span className="text-neutral-400">Day:</span> {item.day_key}
      </p>
      <p>
        <span className="text-neutral-400">Slot:</span> {item.slot_key}
      </p>
      <p>
        <span className="text-neutral-400">Dish:</span> {item.dish_name ?? "No dish assigned"}
      </p>
      <p>
        <span className="text-neutral-400">Notes:</span> {item.notes ?? "No notes"}
      </p>
    </div>
  );
}
