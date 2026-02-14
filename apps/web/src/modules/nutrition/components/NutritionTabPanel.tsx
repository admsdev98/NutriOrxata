import type { FormEvent } from "react";

import type { NutritionProfileForm, NutritionTargetsApi } from "../types";

export type NutritionTabPanelProps = {
  selectedClientName: string;
  authSession: {
    token: string;
    accessMode: "active" | "read_only";
    email: string;
  } | null;
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

export function NutritionTabPanel(props: NutritionTabPanelProps) {
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
