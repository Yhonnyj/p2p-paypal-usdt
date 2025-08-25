import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher"; // 👈 IMPORTANTE

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
    const config = await prisma.appConfig.findUnique({ where: { id: 1 } });

    if (!config) {
      return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch {
    console.error("Error obteniendo configuración");
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { feePercent, rate, bsRate } = body;

    const updated = await prisma.appConfig.update({
      where: { id: 1 },
      data: {
        feePercent: parseFloat(feePercent),
        rate: parseFloat(rate),
        bsRate: parseFloat(bsRate),
      },
    });

    // 🔔 Emitir evento de configuración actualizada
    await pusherServer.trigger("app-config", "config-updated", {
      feePercent: updated.feePercent,
    });

    return NextResponse.json(updated);
  } catch {
    console.error("Error actualizando configuración");
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
