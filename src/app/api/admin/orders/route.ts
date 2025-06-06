import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_CLERK_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS";

export async function GET() {
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            fullName: true, // ← nombre del cliente
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error obteniendo órdenes admin:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
