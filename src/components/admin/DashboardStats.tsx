"use client";

import { useState } from "react";
import { useAdminStats, type RangeOption } from "@/hooks/useAdminStats";

const ranges: { label: string; value: RangeOption }[] = [
  { label: "7 días", value: "7d" },
  { label: "15 días", value: "15d" },
  { label: "Mes", value: "month" },
  { label: "Todo", value: "all" },
];

export default function AdminDashboardStats() {
  const [range, setRange] = useState<RangeOption>("month");
  const { data, loading } = useAdminStats(range);

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Cargando estadísticas...</div>;
  }

  if (!data) {
    return <div className="text-red-500 text-center">Error al cargar estadísticas</div>;
  }

  const {
    totalUSD = 0,
    totalUSDT = 0,
    totalBS = 0, // ✅ CAMBIADO para que coincida con la API
    stats: { COMPLETED = 0, PENDING = 0, CANCELLED = 0 } = {},
  } = data;

  return (
    <div className="mt-6">
      {/* Botones de rango */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ranges.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              range === value
                ? "bg-white text-black font-semibold"
                : "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="💰 Total USD recibidos" value={`$${totalUSD.toFixed(2)}`} />
        <Card title="🪙 Total USDT enviados" value={`${totalUSDT.toFixed(2)} USDT`} />
        <Card title="🇻🇪 Total BS (USD)" value={`$${totalBS.toFixed(2)}`} />
        <Card title="✅ Completadas" value={COMPLETED.toString()} />
        <Card title="🕒 Pendientes" value={PENDING.toString()} />
        <Card title="❌ Canceladas" value={CANCELLED.toString()} />
      </div>
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
