// src/app/api/rates/route.ts
// Esta ruta es para que CUALQUIER cliente autenticado pueda obtener las tasas de cambio.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Asegúrate de que esta ruta sea correcta para tu 'prisma'

export async function GET() {
  const { userId } = await auth();

  // Verifica si el usuario está autenticado. Si no, deniega el acceso.
  if (!userId) {
    return NextResponse.json({ error: "No autorizado. Inicie sesión para ver las tasas." }, { status: 401 });
  }

  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { currency: "asc" }, // Ordena las monedas alfabéticamente
    });

    // Retorna las tasas de cambio si el usuario está autenticado
    return NextResponse.json(rates);
  } catch (err) {
    console.error("Error al obtener tasas para clientes:", err);
    return NextResponse.json({ error: "Error del servidor al cargar tasas." }, { status: 500 });
  }
}
