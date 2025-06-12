// src/app/api/admin/rates/[currency]/route.ts
// Esta ruta es EXCLUSIVA para que el ADMINISTRADOR gestione (PATCH, DELETE) tasas de cambio específicas.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // ¡IMPORTANTE: Reemplaza esto con TU ID de administrador de Clerk!

export async function PATCH(
  req: Request,
  context: { params: { currency: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const currency = context.params.currency.toUpperCase();
  const body = await req.json();
  const { rate } = body;

  if (!rate || typeof rate !== "number") {
    return NextResponse.json({ error: "Tasa inválida" }, { status: 400 });
  }

  try {
    const updated = await prisma.exchangeRate.update({
      where: { currency },
      data: { rate },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) { // FIX: Cambiado de 'any' a 'unknown'
    console.error("Error actualizando tasa:", err);
    // Realizamos una comprobación de tipo para acceder a propiedades de 'err' de forma segura
    if (err instanceof Error) {
        return NextResponse.json({ error: err.message || "Moneda no encontrada o error del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Moneda no encontrada o error del servidor" }, { status: 500 });
  }
}


export async function DELETE(
  req: Request,
  context: { params: { currency: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const currency = context.params.currency.toUpperCase();

  try {
    await prisma.exchangeRate.delete({
      where: { currency },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) { // FIX: Cambiado de 'any' a 'unknown'
    console.error("Error al eliminar tasa:", err);
    // Realizamos una comprobación de tipo para acceder a propiedades de 'err' de forma segura
    if (err instanceof Error && 'code' in err && (err as any).code === 'P2025') { // Prisma NotFoundError
      return NextResponse.json({ error: "La moneda no existe." }, { status: 404 });
    }
    if (err instanceof Error) {
        return NextResponse.json({ error: err.message || "No se pudo eliminar la moneda" }, { status: 500 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la moneda" }, { status: 500 });
  }
}