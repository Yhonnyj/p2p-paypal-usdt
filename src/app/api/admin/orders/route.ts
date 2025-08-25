import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

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
  } catch (error: unknown) { // FIX: Tipado 'unknown' para el error
    console.error("Error obteniendo órdenes admin:", error);
    // FIX: Verificación de tipo para acceder a 'message' de forma segura
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}