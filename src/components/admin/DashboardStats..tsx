"use client";

import { useAdminStats } from "@/hooks/useAdminStats";

export default function AdminDashboardStats() {
  const { data, loading } = useAdminStats();

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Cargando estadísticas...</div>;
  }

  if (!data) {
    return <div className="text-red-500 text-center">Error al cargar estadísticas</div>;
  }

  const {
    totalUSD = 0,
    totalUSDT = 0,
    stats: {
      COMPLETED = 0,
      PENDING = 0,
      CANCELLED = 0,
    } = {},
  } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <Card title="💵 Total USD (BS)" value={`$${totalUSD.toFixed(2)}`} />
      <Card title="🪙 Total USDT" value={`${totalUSDT.toFixed(2)} USDT`} />
      <Card title="✅ Completadas" value={COMPLETED.toString()} />
      <Card title="🕒 Pendientes" value={PENDING.toString()} />
      <Card title="❌ Canceladas" value={CANCELLED.toString()} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl shadow-lg p-4 border border-zinc-800">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold mt-1 text-white">{value}</div>
    </div>
  );
}
