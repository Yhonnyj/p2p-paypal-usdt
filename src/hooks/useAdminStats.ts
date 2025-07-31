// hooks/useAdminStats.ts
import { useEffect, useState } from "react";

export function useAdminStats() {
  const [data, setData] = useState<{
    totalUSD: number;
    totalUSDT: number;
    stats: {
      COMPLETED: number;
      PENDING: number;
      CANCELLED: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error al cargar stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { data, loading };
}
