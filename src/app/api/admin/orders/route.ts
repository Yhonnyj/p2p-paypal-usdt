import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_CLERK_IDS =
  process.env.APP_ENV === "production"
    ? (process.env.ADMIN_CLERK_ID_PROD?.split(",") || [])
    : [process.env.ADMIN_CLERK_ID_STAGING || ""];

export async function GET() {
  const { userId } = await auth();

  if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error: unknown) {
    console.error("Error obteniendo órdenes admin:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Error interno del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
