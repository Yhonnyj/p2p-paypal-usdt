// app/api/admin/stats/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const completedOrders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
    });

    const totalUSD = completedOrders
      .filter(o => o.to.includes("BS")) // Cambio de PayPal a BS
      .reduce((sum, o) => sum + o.finalUsd, 0);

    const totalUSDT = completedOrders
      .filter(o => o.to.includes("USDT"))
      .reduce((sum, o) => sum + o.finalUsdt, 0);

    const [completedCount, pendingCount, cancelledCount] = await Promise.all([
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
    ]);

    return NextResponse.json({
      totalUSD,
      totalUSDT,
      stats: {
        COMPLETED: completedCount,
        PENDING: pendingCount,
        CANCELLED: cancelledCount,
      },
    });
  } catch (error) {
    console.error("❌ Error en stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
