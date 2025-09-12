"use client";

import { useEffect, useMemo, useState } from "react";

export type RangeOption = "7d" | "15d" | "month" | "all" | "custom";

export type AdminStatsResponse = {
  totalUSD: number;
  totalUSDT: number;
  totalBS: number; // coherente con tu API
  stats: {
    COMPLETED: number;
    PENDING: number;
    CANCELLED: number;
  };
  // opcionales para futuras mejoras
  range?: string;
  window?: { gte: string; lte: string };
  prevPeriod?: Partial<AdminStatsResponse>;
  delta?: Record<string, number>;
  timeseries?: Array<{
    label: string;
    totalUSD: number;
    totalUSDT: number;
    totalBS: number;
  }>;
};

type Options = {
  tz?: string; // ej: "America/Toronto"
  compare?: boolean; // true -> ?compare=1
  series?: "day" | "week" | "month";
};

export function useAdminStats(
  range: RangeOption = "month",
  customStart?: string,
  customEnd?: string,
  opts: Options = {}
) {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("range", range);

    if (range === "custom" && customStart && customEnd) {
      sp.set("start", customStart);
      sp.set("end", customEnd);
    }
    if (opts.tz) sp.set("tz", opts.tz);
    if (opts.compare) sp.set("compare", "1");
    if (opts.series) sp.set("series", opts.series);

    return sp.toString();
  }, [range, customStart, customEnd, opts.tz, opts.compare, opts.series]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/admin/stats?${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const json = (await res.json()) as AdminStatsResponse;
        setData(json);
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("❌ Error al cargar stats:", e);
          setData(null);
          setError(e.message || "Error al cargar estadísticas");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [query]);

  return { data, loading, error };
}

// Si quieres también exportar el tipo de respuesta para otros componentes:
// export type { AdminStatsResponse };
