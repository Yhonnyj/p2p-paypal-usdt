import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Reemplaza por tu ID si es distinto

export async function GET() {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { currency: "asc" },
    });

    return NextResponse.json(rates);
  } catch (err) {
    console.error("Error al obtener tasas:", err);
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

    const newRate = await prisma.exchangeRate.create({
      data: {
        currency: currency.toUpperCase(),
        rate,
      },
    });

    return NextResponse.json(newRate, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Esa moneda ya existe" }, { status: 409 });
    }

    console.error("Error al crear tasa:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
