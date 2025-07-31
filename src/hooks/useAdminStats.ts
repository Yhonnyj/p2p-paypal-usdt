// hooks/useAdminStats.ts
import { useEffect, useState } from "react";

type AdminStatsResponse = {
  totalUSD: number;
  totalUSDT: number;
  stats: {
    COMPLETED: number;
    PENDING: number;
    CANCELLED: number;
  };
};

type RangeOption = "7d" | "15d" | "month" | "all" | "custom";

export function useAdminStats(range: RangeOption = "month", customStart?: string, customEnd?: string) {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        let url = `/api/admin/stats?range=${range}`;

        if (range === "custom" && customStart && customEnd) {
          url += `&start=${customStart}&end=${customEnd}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ Error al cargar stats:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [range, customStart, customEnd]);

  return { data, loading };
}

export type { RangeOption };
