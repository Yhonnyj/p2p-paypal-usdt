// app/api/admin/stats/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

const dateFilter: { gte?: Date; lte?: Date } = {};

    const now = new Date();

    if (range === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      dateFilter.gte = sevenDaysAgo;
    } else if (range === "15d") {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      dateFilter.gte = fifteenDaysAgo;
    } else if (range === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter.gte = startOfMonth;
    } else if (range === "custom" && start && end) {
      dateFilter.gte = new Date(start);
      dateFilter.lte = new Date(end);
    }
    // Si range=all, no se aplica ningún filtro

    const where = {
      status: "COMPLETED" as const,
      ...(range !== "all" && { createdAt: dateFilter }),
    };

    const completedOrders = await prisma.order.findMany({ where });

    const totalUSD = completedOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalUSDT = completedOrders.reduce((sum, o) => sum + o.finalUsdt, 0);

    const [completedCount, pendingCount, cancelledCount] = await Promise.all([
      prisma.order.count({ where: { status: "COMPLETED", ...(range !== "all" && { createdAt: dateFilter }) } }),
      prisma.order.count({ where: { status: "PENDING", ...(range !== "all" && { createdAt: dateFilter }) } }),
      prisma.order.count({ where: { status: "CANCELLED", ...(range !== "all" && { createdAt: dateFilter }) } }),
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
