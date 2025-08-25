import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Side = "BUY" | "SELL";

type QuoteRequest = {
  side: Side;                 // "BUY" | "SELL"
  channelKey: string;         // ej: "PAYPAL", "ZELLE"
  amountUsd: number;          // monto en USD que ingresa el usuario
  destinationCurrency: string;// "USDT" o fiat ("BS", "COP", ...)
  // opcionales por si quieres usarlos ahora o después:
  userDiscountPercent?: number; // descuento por usuario (0 a X)
  includeBaseFee?: boolean;     // si quieres sumar AppConfig.feePercent
};

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
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "Monto USD inválido" }, { status: 400 });
    }

    const destinationCurrency = String(body.destinationCurrency || "").toUpperCase();
    if (!destinationCurrency) {
      return NextResponse.json({ error: "Falta 'destinationCurrency'" }, { status: 400 });
    }

    const userDiscountPercent = Number(body.userDiscountPercent ?? 0);
    const includeBaseFee = Boolean(body.includeBaseFee);

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
      const app = await prisma.appConfig.findUnique({ where: { id: 1 } });
      baseFeePercent = Number(app?.feePercent ?? 0);
    }

    // descuento de usuario (respetar 0)
    const totalPct = Math.max(0, baseFeePercent + channelPercent - userDiscountPercent);

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

    // -------- Cálculo --------
    const netUsd = amountUsd * (1 - totalPct / 100);
    const netFiat = netUsd * exchangeRateUsed;

    // -------- Respuesta --------
    return NextResponse.json({
      side,
      channelKey: channel.key,
      channelLabel: channel.label,
      destinationCurrency,
      amountUsd,
      commissionPercent: channelPercent,
      baseFeePercent,
      userDiscountPercent,
      totalPct,
      netUsd,
      exchangeRateUsed,
      totalInDestination: netFiat, // si USDT → equivale a netUsd
    });
  } catch (err) {
    console.error("Error en /api/quote:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
