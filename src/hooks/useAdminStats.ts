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

export function useAdminStats() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ Error al cargar stats:", err);
        setData(null); // por seguridad, dejamos null si falla
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { data, loading };
}
