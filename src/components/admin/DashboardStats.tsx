"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAdminStats, type RangeOption } from "@/hooks/useAdminStats";

/* Recharts sin SSR */
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart           = dynamic(() => import("recharts").then(m => m.LineChart),           { ssr: false });
const Line                = dynamic(() => import("recharts").then(m => m.Line),                { ssr: false });
const XAxis               = dynamic(() => import("recharts").then(m => m.XAxis),               { ssr: false });
const YAxis               = dynamic(() => import("recharts").then(m => m.YAxis),               { ssr: false });
const Tooltip             = dynamic(() => import("recharts").then(m => m.Tooltip),             { ssr: false });

/* Formato */
const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const cf = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtCurrency = (v: number) => cf.format(v || 0);
const fmtNumber   = (v: number) => nf.format(v || 0);

/* Rango */
const baseRanges: { label: string; value: RangeOption }[] = [
  { label: "7 días",   value: "7d" },
  { label: "15 días",  value: "15d" },
  { label: "Mes",      value: "month" },
  { label: "Todo",     value: "all" },
  { label: "Personalizado", value: "custom" },
];

type TimesPoint = { label: string; totalUSD?: number; totalUSDT?: number; totalBS?: number; totalProfit?: number };

export default function AdminDashboardStats() {
  // ⚠️ Hooks SIEMPRE arriba y en el mismo orden
  const [range, setRange]       = useState<RangeOption>("month");
  const [start, setStart]       = useState<string>(""); // YYYY-MM-DD
  const [end, setEnd]           = useState<string>("");
  const isCustom                = range === "custom";

  // Un SOLO hook para datos; pasamos start/end sólo si hace falta
  const { data, loading, error } = useAdminStats(
    range,
    isCustom ? start : undefined,
    isCustom ? end   : undefined,
    { series: "day" }
  );

  // Series: derivadas SIEMPRE con useMemo (no condicionales)
  const times: TimesPoint[] = (data?.timeseries as TimesPoint[]) ?? [];

  const seriesUSD    = useMemo(() => times.map(d => ({ name: d.label, usd:    Number(d.totalUSD    || 0) })), [times]);
  const seriesUSDT   = useMemo(() => times.map(d => ({ name: d.label, usdt:   Number(d.totalUSDT   || 0) })), [times]);
  const seriesBS     = useMemo(() => times.map(d => ({ name: d.label, bs:     Number(d.totalBS     || 0) })), [times]);
  const seriesProfit = useMemo(() => times.map(d => ({ name: d.label, profit: Number(d.totalProfit || 0) })), [times]);

  if (loading) return <SkeletonGrid />;
  if (error || !data) return <div className="text-red-500 text-center font-medium">❌ Error al cargar estadísticas</div>;

  const {
    totalUSD     = 0,
    totalUSDT    = 0,
    totalBS      = 0,
    totalProfit  = 0, // <- nuevo
    stats: { COMPLETED = 0, PENDING = 0, CANCELLED = 0 } = {},
  } = data as unknown as {
    totalUSD: number; totalUSDT: number; totalBS: number; totalProfit?: number;
    stats: { COMPLETED: number; PENDING: number; CANCELLED: number };
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Controles de rango */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-3" role="tablist" aria-label="Rango del reporte">
          {baseRanges.map(({ label, value }) => (
            <button
              key={value}
              role="tab"
              aria-selected={range === value}
              onClick={() => setRange(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                range === value
                  ? "bg-emerald-500 text-white shadow-lg scale-105"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Picker personalizado (NO mueve hooks) */}
        {isCustom && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-zinc-400">Inicio</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <label className="text-sm text-zinc-400">Fin</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        )}
      </div>

      {/* Tarjetas principales (incluye Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="💰 Total USD recibidos"  value={fmtCurrency(totalUSD)}                         gradient="from-emerald-500/20 to-emerald-500/5" />
        <StatCard title="🪙 Total USDT enviados"  value={`${fmtNumber(totalUSDT)} USDT`}               gradient="from-blue-500/20 to-blue-500/5" />
        <StatCard title="🇻🇪 Total BS (USD)"      value={fmtCurrency(totalBS)}                          gradient="from-yellow-500/20 to-yellow-500/5" />
        <StatCard title="📈 Profit total (USD)"   value={fmtCurrency(totalProfit || 0)}                 gradient="from-fuchsia-500/20 to-fuchsia-500/5" />
        <StatCard title="✅ Completadas"          value={fmtNumber(COMPLETED)}                          gradient="from-emerald-400/20 to-emerald-400/5" />
        <StatCard title="🕒 Pendientes"           value={fmtNumber(PENDING)}                            gradient="from-orange-400/20 to-orange-400/5" />
        <StatCard title="❌ Canceladas"           value={fmtNumber(CANCELLED)}                          gradient="from-red-500/20 to-red-500/5" />
      </div>

      {/* Gráficas (si hay timeseries) */}
      {times.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <ChartCard title="Tendencia USD recibidos">
            <ChartSparkline dataKey="usd"    stroke="#10b981" data={seriesUSD} />
          </ChartCard>

          <ChartCard title="Tendencia USDT enviados">
            <ChartSparkline dataKey="usdt"   stroke="#60a5fa" data={seriesUSDT} />
          </ChartCard>

          <ChartCard title="Tendencia BS (USD)">
            <ChartSparkline dataKey="bs"     stroke="#f59e0b" data={seriesBS} />
          </ChartCard>

          <ChartCard title="Tendencia Profit (USD)">
            <ChartSparkline dataKey="profit" stroke="#a78bfa" data={seriesProfit} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

/* ====== Cards ====== */
function StatCard({ title, value, gradient }: { title: string; value: string | number; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 200, damping: 16 }}
      className={`rounded-2xl border border-zinc-800 bg-gradient-to-br ${gradient} p-5 shadow-lg`}
    >
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-3xl font-bold mt-2 text-white tracking-tight">{value}</div>
    </motion.div>
  );
}

/* ====== Chart wrappers ====== */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
      <div className="text-sm text-zinc-400 mb-3">{title}</div>
      {children}
    </div>
  );
}

function ChartSparkline<T extends Record<string, any>>({
  data,
  dataKey,
  stroke,
}: {
  data: T[];
  dataKey: keyof T;
  stroke: string;
}) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            cursor={{ strokeWidth: 0 }}
            contentStyle={{ background: "#0b0f16", border: "1px solid #27272a", borderRadius: "10px", color: "#fff" }}
            formatter={(val: unknown) => [fmtNumber(Number(val) || 0), ""]}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Line type="monotone" dataKey={dataKey as string} stroke={stroke} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ====== Skeleton ====== */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
        </div>
      ))}
    </div>
  );
}
