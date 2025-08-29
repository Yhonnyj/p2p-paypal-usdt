// app/api/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type Side = "BUY" | "SELL";

type QuoteRequest = {
  side: Side;                   // "BUY" | "SELL"
  channelKey: string;           // ej: "PAYPAL", "ZELLE"
  amountUsd: number;            // monto en USD que ingresa el usuario (permite 0 para preview)
  destinationCurrency: string;  // "USDT" o fiat ("BS", "COP", ...)
  includeBaseFee?: boolean;     // si quieres sumar AppConfig.feePercent
};

type Milestone = "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null;

function milestoneDiscount(nthOrder: number): { percent: number; milestone: Milestone } {
  if (nthOrder === 1) return { percent: 50, milestone: "FIRST" };
  if (nthOrder === 5) return { percent: 18, milestone: "FIFTH" };
  if (nthOrder >= 15) return { percent: 10, milestone: "FIFTEEN_PLUS" };
  return { percent: 0, milestone: null };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuoteRequest;

    // -------- Validaciones de entrada --------
    const side = String(body.side || "").toUpperCase() as Side;
    if (side !== "BUY" && side !== "SELL") {
      return NextResponse.json({ error: "Parámetro 'side' inválido" }, { status: 400 });
    }

    const channelKey = String(body.channelKey || "").toUpperCase();
    if (!channelKey) {
      return NextResponse.json({ error: "Falta 'channelKey'" }, { status: 400 });
    }

    const amountUsd = Number(body.amountUsd);
    // Permitimos 0 para previsualizar; solo invalidamos negativos o NaN.
    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
      return NextResponse.json({ error: "Monto USD inválido" }, { status: 400 });
    }

    const destinationCurrency = String(body.destinationCurrency || "").toUpperCase();
    if (!destinationCurrency) {
      return NextResponse.json({ error: "Falta 'destinationCurrency'" }, { status: 400 });
    }

    const includeBaseFee = Boolean(body.includeBaseFee);

    // -------- Identificar usuario (Clerk) y calcular descuento fidelidad --------
    const { userId } = await auth();
    let userDiscountPercent = 0;
    let milestone: Milestone = null;

    if (userId) {
      // Busca tu usuario interno por clerkId (ajusta si tu modelo usa otro campo)
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (dbUser) {
        // Contar SOLO órdenes COMPLETED del usuario (ajusta nombre del campo si difiere)
        const completedCount = await prisma.order.count({
          where: { userId: dbUser.id, status: "COMPLETED" },
        });
        const nthOrder = completedCount + 1;
        const rule = milestoneDiscount(nthOrder);
        userDiscountPercent = rule.percent;
        milestone = rule.milestone;
      }
      // Si no hay dbUser, dejamos descuento en 0 (usuario no registrado en tu tabla interna)
    } else {
      // Usuario no logueado → 0% (puedes agregar un flag tipo needsAuth: true si quieres)
      userDiscountPercent = 0;
      milestone = null;
    }

    // -------- Buscar canal de pago --------
    const channel = await prisma.paymentChannel.findUnique({
      where: { key: channelKey },
      select: {
        key: true,
        label: true,
        commissionBuyPercent: true,
        commissionSellPercent: true,
        enabledBuy: true,
        enabledSell: true,
        visible: true,
        archivedAt: true,
        statusTextBuy: true,
        statusTextSell: true,
      },
    });

    if (!channel || channel.archivedAt) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    // disponibilidad por lado
    const enabled = side === "BUY" ? channel.enabledBuy : channel.enabledSell;
    if (!channel.visible || !enabled) {
      const statusText = side === "BUY" ? channel.statusTextBuy : channel.statusTextSell;
      return NextResponse.json(
        { error: statusText || "Método no disponible" },
        { status: 400 }
      );
    }

    // -------- Comisión por lado --------
    const channelPercent =
      side === "BUY" ? channel.commissionBuyPercent : channel.commissionSellPercent;

    // (Opcional) Fee base desde AppConfig si lo quieres sumar
    let baseFeePercent = 0;
    if (includeBaseFee) {
      const app = await prisma.appConfig.findFirst(); // más robusto que id fijo
      baseFeePercent = Number(app?.feePercent ?? 0);
    }

    // -------- Descuento (correcto, multiplicativo) --------
    const preDiscountPercent = channelPercent + baseFeePercent;
    const totalPct = preDiscountPercent * (1 - userDiscountPercent / 100);

    // -------- Exchange rate --------
    let exchangeRateUsed = 1; // USDT por defecto
    if (destinationCurrency !== "USDT") {
      const fx = await prisma.exchangeRate.findUnique({
        where: { currency: destinationCurrency },
        select: { rate: true },
      });
      if (!fx) {
        return NextResponse.json(
          { error: `No hay tasa para ${destinationCurrency}` },
          { status: 400 }
        );
      }
      exchangeRateUsed = Number(fx.rate);
      if (!Number.isFinite(exchangeRateUsed) || exchangeRateUsed <= 0) {
        return NextResponse.json(
          { error: `Tasa inválida para ${destinationCurrency}` },
          { status: 400 }
        );
      }
    }

    // -------- Cálculo de montos --------
    const netUsd = amountUsd * (1 - totalPct / 100);
    const totalInDestination = netUsd * exchangeRateUsed;

    // -------- Respuesta --------
    return NextResponse.json({
      side,
      channelKey: channel.key,
      channelLabel: channel.label,
      destinationCurrency,
      amountUsd,

      // Detalle de comisiones/desc.
      commissionPercent: channelPercent,   // % del canal (lado)
      baseFeePercent,                      // % base global opcional
      preDiscountPercent,                  // % antes de descuento (para “Cotización base”)
      userDiscountPercent,                 // % por fidelidad según milestones
      totalPct,                            // % total aplicado (ya con descuento)

      // Montos resultantes
      netUsd,                              // USD neto
      exchangeRateUsed,                    // 1 si USDT, o tasa fiat
      totalInDestination,                  // netUsd * tasa (si USDT → == netUsd)

      // UI/UX helpers
      milestone,                           // "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null
    });
  } catch (err) {
    console.error("Error en /api/quote:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
