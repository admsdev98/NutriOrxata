export type AuthSession = {
  token: string;
  accessMode: "active" | "read_only";
  email: string;
};

const AUTH_STORAGE_KEY = "worker-auth-session";

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.email || !parsed?.accessMode) {
      return null;
    }
    if (parsed.accessMode !== "active" && parsed.accessMode !== "read_only") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
