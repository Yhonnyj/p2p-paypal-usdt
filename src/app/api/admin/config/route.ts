// app/api/admin/config/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_CLERK_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // ← tu userId admin

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
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
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
    const { feePercent, rate } = body;

    const updated = await prisma.appConfig.update({
      where: { id: 1 },
      data: {
        feePercent: parseFloat(feePercent),
        rate: parseFloat(rate),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
