import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Esta API es pública para clientes (sin validación de admin)
export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: 1 } });

    if (!config) {
      return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      rate: config.rate,
      feePercent: config.feePercent,
    });
  } catch (error) {
    console.error("Error cargando configuración pública:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
