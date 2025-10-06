// app/api/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type Side = "BUY" | "SELL";

type QuoteRequest = {
  side: Side;                   // "BUY" | "SELL"
  channelKey: string;           // "PAYPAL", "ZELLE", ...
  amountUsd: number;            // permite 0 para previsualizar
  destinationCurrency: string;  // "USDT" | "USD" | "BS" | "COP" | ...
};

type Milestone = "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null;

function milestoneDiscount(nthOrder: number): { percent: number; milestone: Milestone } {
  if (nthOrder === 1) return { percent: 25, milestone: "FIRST" };
  if (nthOrder === 5) return { percent: 15, milestone: "FIFTH" };
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

    const channelKey = String(body.channelKey || "").toUpperCase().trim();
    if (!channelKey) {
      return NextResponse.json({ error: "Falta 'channelKey'" }, { status: 400 });
    }

    const amountUsd = Number(body.amountUsd);
    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
      return NextResponse.json({ error: "Monto USD inválido" }, { status: 400 });
    }

    const destinationCurrency = String(body.destinationCurrency || "").toUpperCase().trim();
    if (!destinationCurrency) {
      return NextResponse.json({ error: "Falta 'destinationCurrency'" }, { status: 400 });
    }

    // -------- Descuento fidelidad (solo BUY; SELL = 0) --------
    const { userId } = await auth();
    let userDiscountPercent = 0;
    let milestone: Milestone = null;

    if (side === "BUY" && userId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (dbUser) {
        const completedCount = await prisma.order.count({
          where: { userId: dbUser.id, status: "COMPLETED" },
        });
        const nthOrder = completedCount + 1;
        const rule = milestoneDiscount(nthOrder);
        userDiscountPercent = rule.percent;
        milestone = rule.milestone;
      }
    }

    // -------- Canal de pago --------
    const channel = await prisma.paymentChannel.findUnique({
      where: { key: channelKey },
      select: {
        key: true,
        label: true,
        commissionBuyPercent: true,
        commissionSellPercent: true,
        providerFeePercent: true, // informativo: no afecta neto del cliente aquí
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

    const enabled = side === "BUY" ? channel.enabledBuy : channel.enabledSell;
    if (!channel.visible || !enabled) {
      const statusText = side === "BUY" ? channel.statusTextBuy : channel.statusTextSell;
      return NextResponse.json({ error: statusText || "Método no disponible" }, { status: 400 });
    }

    // -------- % del canal por lado (sin AppConfig) --------
    const channelPercent =
      side === "BUY" ? channel.commissionBuyPercent : channel.commissionSellPercent;

    // % total (multiplicativo con descuento de fidelidad)
    const preDiscountPercent = channelPercent;
    const totalPct = preDiscountPercent * (1 - userDiscountPercent / 100);

    // -------- Tasa de cambio (buy/sell con fallback a rate) --------
    let exchangeRateUsed = 1; // 1 para USDT y también para USD
    if (destinationCurrency !== "USDT" && destinationCurrency !== "USD") {
      const fx = await prisma.exchangeRate.findUnique({
        where: { currency: destinationCurrency },
        select: { rate: true, buyRate: true, sellRate: true },
      });

      if (!fx) {
        return NextResponse.json(
          { error: `No hay tasa para ${destinationCurrency}` },
          { status: 400 }
        );
      }

      const sideRate = side === "BUY" ? fx.buyRate : fx.sellRate;
      const picked = Number(sideRate ?? fx.rate);

      if (!Number.isFinite(picked) || picked <= 0) {
        return NextResponse.json(
          { error: `Tasa inválida para ${destinationCurrency}` },
          { status: 400 }
        );
      }
      exchangeRateUsed = picked;
    }

    // -------- Montos --------
    const netUsd = amountUsd * (1 - totalPct / 100);
    const totalInDestination = netUsd * exchangeRateUsed;

    // -------- Respuesta --------
    return NextResponse.json({
      side,
      channelKey: channel.key,
      channelLabel: channel.label,
      destinationCurrency,
      amountUsd,

      // % detallados
      commissionPercent: channelPercent,
      preDiscountPercent,
      userDiscountPercent, // 0 en SELL
      totalPct,

      // montos
      netUsd,
      exchangeRateUsed,
      totalInDestination,

      // informativo
      providerFeePercent: channel.providerFeePercent ?? 0,

      // UX
      milestone, // null en SELL
    });
  } catch (err) {
    console.error("Error en /api/quote:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
