import type { Health } from "../../../shared/types/health";

export async function getHealth(): Promise<Health> {
  const res = await fetch("/api/health");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Health;
}
