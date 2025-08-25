import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Side = "BUY" | "SELL";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sideParam = (url.searchParams.get("side") || "BUY").toUpperCase() as Side;

  const side: Side = sideParam === "SELL" ? "SELL" : "BUY";

  try {
    const rows = await prisma.paymentChannel.findMany({
      where: {
        archivedAt: null,   // no mostrar archivados
        visible: true,      // solo visibles
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        key: true,
        label: true,
        commissionBuyPercent: true,
        commissionSellPercent: true,
        enabledBuy: true,
        enabledSell: true,
        statusTextBuy: true,
        statusTextSell: true,
        sortOrder: true,
      },
    });

    const items = rows.map((r) => {
      const enabled = side === "BUY" ? r.enabledBuy : r.enabledSell;
      const statusText = side === "BUY" ? r.statusTextBuy : r.statusTextSell;
      const commissionPercent =
        side === "BUY" ? r.commissionBuyPercent : r.commissionSellPercent;

      return {
        key: r.key,
        label: r.label,
        commissionPercent,
        available: !!enabled,
        displayStatus: enabled ? "Disponible" : (statusText || "No disponible"),
        sortOrder: r.sortOrder,
        // (opcional) si tu cliente quiere ver ambas a la vez:
        // commissionBuyPercent: r.commissionBuyPercent,
        // commissionSellPercent: r.commissionSellPercent,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error listando canales públicos:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
