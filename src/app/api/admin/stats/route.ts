// app/api/admin/stats/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin según entorno (igual que /api/admin/rates)
const ADMIN_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

type RangeKey =
  | "today"
  | "yesterday"
  | "week"
  | "7d"
  | "15d"
  | "last30"
  | "month"
  | "lastMonth"
  | "quarter"
  | "year"
  | "ytd"
  | "custom"
  | "all";

// ========== Helpers de fecha con TZ ==========
function nowInTZ(tz?: string) {
  if (!tz) return new Date();
  const str = new Date().toLocaleString("en-US", { timeZone: tz });
  return new Date(str);
}
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
function endOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 dom
  const diff = (day + 6) % 7; // lunes
  const s = new Date(d);
  s.setDate(d.getDate() - diff);
  return startOfDay(s);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function startOfQuarter(d: Date) { const q = Math.floor(d.getMonth() / 3) * 3; return new Date(d.getFullYear(), q, 1, 0, 0, 0, 0); }
function endOfQuarter(d: Date) { const q = Math.floor(d.getMonth() / 3) * 3; return new Date(d.getFullYear(), q + 3, 0, 23, 59, 59, 999); }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0); }
function endOfYear(d: Date) { return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999); }
function shiftPeriod(start: Date, end: Date) {
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span + 1);
  return { prevStart, prevEnd };
}
function resolveRange(params: { range: RangeKey; tz?: string | null; start?: string | null; end?: string | null; }) {
  const { range, tz, start, end } = params;
  const now = nowInTZ(tz || undefined);
  if (range === "all") return { gte: undefined as Date | undefined, lte: undefined as Date | undefined, prev: null };

  let gte!: Date; let lte!: Date;
  switch (range) {
    case "today": gte = startOfDay(now); lte = endOfDay(now); break;
    case "yesterday": { const y = new Date(now); y.setDate(now.getDate() - 1); gte = startOfDay(y); lte = endOfDay(y); break; }
    case "week": gte = startOfWeek(now); lte = endOfDay(now); break;
    case "7d": { const s = new Date(now); s.setDate(now.getDate() - 7); gte = s; lte = now; break; }
    case "15d": { const s = new Date(now); s.setDate(now.getDate() - 15); gte = s; lte = now; break; }
    case "last30": { const s = new Date(now); s.setDate(now.getDate() - 30); gte = s; lte = now; break; }
    case "month": gte = startOfMonth(now); lte = endOfMonth(now); break;
    case "lastMonth": { const ref = new Date(now.getFullYear(), now.getMonth() - 1, 15); gte = startOfMonth(ref); lte = endOfMonth(ref); break; }
    case "quarter": gte = startOfQuarter(now); lte = endOfQuarter(now); break;
    case "year": gte = startOfYear(now); lte = endOfYear(now); break;
    case "ytd": gte = startOfYear(now); lte = now; break;
    case "custom": {
      if (!start || !end) throw new Error("custom requiere start y end (YYYY-MM-DD)");
      gte = new Date(start + "T00:00:00.000");
      lte = new Date(end + "T23:59:59.999");
      break;
    }
    default: gte = startOfMonth(now); lte = endOfMonth(now);
  }
  const { prevStart, prevEnd } = shiftPeriod(gte, lte);
  return { gte, lte, prev: { gte: prevStart, lte: prevEnd } };
}

// ========= Agregadores (ARREGLADOS) =========
async function getStats(rangeWhere: any) {
  // Sumas SOLO de COMPLETED, igual que la API vieja
  const completedWhere = { ...rangeWhere, status: "COMPLETED" as const };

  const sumsCompleted = await prisma.order.aggregate({
    where: completedWhere,
    _sum: { amount: true, finalUsdt: true },
  });

  // BS solo cuando to === "BS" y COMPLETED
  const sumsBs = await prisma.order.aggregate({
    where: { ...completedWhere, to: "BS" },
    _sum: { finalUsd: true },
  });

  // Conteos por estado dentro del mismo rango
  const [completed, pending, cancelled] = await Promise.all([
    prisma.order.count({ where: { ...rangeWhere, status: "COMPLETED" } }),
    prisma.order.count({ where: { ...rangeWhere, status: "PENDING" } }),
    prisma.order.count({ where: { ...rangeWhere, status: "CANCELLED" } }),
  ]);

  return {
    totalUSD: Number(sumsCompleted._sum.amount || 0),
    totalUSDT: Number(sumsCompleted._sum.finalUsdt || 0),
    totalBS: Number(sumsBs._sum.finalUsd || 0),
    stats: { COMPLETED: completed, PENDING: pending, CANCELLED: cancelled },
  };
}

type SeriesKey = "day" | "week" | "month";

function buildTimeseries<
  T extends { createdAt: Date; amount: number; finalUsdt: number; finalUsd: number; to?: string }
>(rows: T[], mode: SeriesKey) {
  const buckets = new Map<string, { totalUSD: number; totalUSDT: number; totalBS: number }>();

  const keyFromDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    if (mode === "day") return `${yyyy}-${mm}-${dd}`;
    if (mode === "week") {
      const s = startOfWeek(new Date(d));
      const sm = String(s.getMonth() + 1).padStart(2, "0");
      const sd = String(s.getDate()).padStart(2, "0");
      return `${s.getFullYear()}-W${sm}${sd}`;
    }
    return `${yyyy}-${mm}`;
  };

  for (const r of rows) {
    const k = keyFromDate(r.createdAt);
    const curr = buckets.get(k) || { totalUSD: 0, totalUSDT: 0, totalBS: 0 };
    curr.totalUSD += r.amount || 0;
    curr.totalUSDT += r.finalUsdt || 0;
    if (r.to === "BS") curr.totalBS += r.finalUsd || 0; // ← SOLO BS reales
    buckets.set(k, curr);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([label, v]) => ({ label, ...v }));
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (ADMIN_ID && userId !== ADMIN_ID) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as RangeKey) || "month";
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const tz = searchParams.get("tz");
    const compare = searchParams.get("compare");
    const series = (searchParams.get("series") as SeriesKey) || undefined;

    const r = resolveRange({ range, tz, start, end });

    const whereBase: any = {};
    if (range !== "all") whereBase.createdAt = { ...(r.gte && { gte: r.gte }), ...(r.lte && { lte: r.lte }) };

    // Métricas del período actual (con FIX)
    const current = await getStats(whereBase);

    // Series (opcional) — SOLO COMPLETED, selecciona 'to' para BS
    let timeseries:
      | Array<{ label: string; totalUSD: number; totalUSDT: number; totalBS: number }>
      | undefined;
    if (series) {
      const rows = await prisma.order.findMany({
        where: { ...whereBase, status: "COMPLETED" },
        select: { createdAt: true, amount: true, finalUsdt: true, finalUsd: true, to: true },
        orderBy: { createdAt: "asc" },
      });
      timeseries = buildTimeseries(rows, series);
    }

    // Comparación (opcional) — usa la MISMA lógica corregida
    let prevPeriod: any = undefined;
    let delta: any = undefined;
    if (compare === "1" && r.prev) {
      const wherePrev: any = { createdAt: { gte: r.prev.gte, lte: r.prev.lte } };
      prevPeriod = await getStats(wherePrev);
      const pct = (curr: number, prev: number) => {
        if (!prev && !curr) return 0;
        if (!prev) return 100;
        return ((curr - prev) / prev) * 100;
      };
      delta = {
        totalUSD: pct(current.totalUSD, prevPeriod.totalUSD),
        totalUSDT: pct(current.totalUSDT, prevPeriod.totalUSDT),
        totalBS: pct(current.totalBS, prevPeriod.totalBS),
        COMPLETED: pct(current.stats.COMPLETED, prevPeriod.stats.COMPLETED),
        PENDING: pct(current.stats.PENDING, prevPeriod.stats.PENDING),
        CANCELLED: pct(current.stats.CANCELLED, prevPeriod.stats.CANCELLED),
      };
    }

    return NextResponse.json({
      range,
      tz: tz || null,
      ...(range !== "all" && { window: { gte: r.gte, lte: r.lte } }),
      ...current,
      ...(timeseries && { timeseries }),
      ...(prevPeriod && { prevPeriod, delta }),
    });
  } catch (error) {
    console.error("❌ Error en stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
