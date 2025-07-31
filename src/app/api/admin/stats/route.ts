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
    // Solo órdenes completadas
    const completedOrders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
    });

    // Total USD que el cliente te envió (PayPal)
    const totalUSD = completedOrders.reduce((sum, o) => sum + o.amount, 0);

    // Total USDT que tú enviaste (no importa si decía BS o USDT)
    const totalUSDT = completedOrders.reduce((sum, o) => sum + o.finalUsdt, 0);

    // Conteo por estado
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
