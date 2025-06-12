// src/app/api/admin/rates/route.ts
// Esta ruta es para que el ADMINISTRADOR gestione (GET, POST) las tasas de cambio.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Reemplaza por tu ID si es distinto

export async function GET() {
  const { userId } = await auth();

  // La función GET del administrador permanece con su protección de ADMIN_ID.
  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { currency: "asc" },
    });

    return NextResponse.json(rates);
  } catch (err: unknown) { // FIX: Cambiado de 'any' a 'unknown'
    console.error("Error al obtener tasas (admin):", err);
    // Realizamos una comprobación de tipo para acceder a propiedades de 'err' de forma segura
    if (err instanceof Error) {
        return NextResponse.json({ error: err.message || "Error del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { currency, rate } = body;

    if (!currency || !rate || typeof rate !== "number") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Aquí, en lugar de crear siempre, se usa 'upsert' que actualiza si existe o crea si no.
    const newRate = await prisma.exchangeRate.upsert({
      where: { currency: currency.toUpperCase() },
      update: { rate: rate },
      create: {
        currency: currency.toUpperCase(),
        rate,
      },
    });

    return NextResponse.json(newRate, { status: 201 });
  } catch (err: unknown) { // FIX: Cambiado de 'any' a 'unknown'
    console.error("Error al crear tasa:", err);
    // FIX: Añadida la directiva para deshabilitar el error de 'any' en esta línea específica.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (err instanceof Error && 'code' in err && (err as any).code === "P2002") {
      return NextResponse.json({ error: "Esa moneda ya existe" }, { status: 409 });
    }
    if (err instanceof Error) {
        return NextResponse.json({ error: err.message || "Error del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
