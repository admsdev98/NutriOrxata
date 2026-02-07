import { useEffect, useState } from "react";

type Health = { status: string };

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Health;
        if (!cancelled) setData(json);
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
