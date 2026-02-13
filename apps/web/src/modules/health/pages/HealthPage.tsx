import { useEffect, useState } from "react";

import { getHealth } from "../api/getHealth";
import type { Health } from "../../../shared/types/health";

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const health = await getHealth();
        if (!cancelled) setData(health);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">API health</h1>
      {error ? (
        <p className="text-red-300">Error: {error}</p>
      ) : data ? (
        <pre className="rounded border border-neutral-800 bg-neutral-900 p-3 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-neutral-300">Loading...</p>
      )}
    </section>
  );
}
