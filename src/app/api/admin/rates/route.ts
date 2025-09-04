// src/app/api/admin/rates/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

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
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { currency: "asc" },
    });
    return NextResponse.json(rates);
  } catch (err: unknown) {
    console.error("Error al obtener tasas (admin):", err);
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message || "Error del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const { currency, rate, buyRate, sellRate } = body as {
      currency?: string;
      rate?: number | string;
      buyRate?: number | string;
      sellRate?: number | string;
    };

    if (!currency) {
      return NextResponse.json({ error: "Currency requerido" }, { status: 400 });
    }

    if (!rate && !buyRate && !sellRate) {
      return NextResponse.json(
        { error: "Al menos una tasa debe ser proporcionada" },
        { status: 400 }
      );
    }

    // ✅ sin any: tipos explícitos
    type UpdateData = { rate?: number; buyRate?: number; sellRate?: number };
    type CreateData = {
      currency: string;
      rate: number;
      buyRate?: number;
      sellRate?: number;
    };

    const updateData: UpdateData = {};
    if (rate !== undefined && rate !== null)
      updateData.rate = parseFloat(String(rate));
    if (buyRate !== undefined && buyRate !== null)
      updateData.buyRate = parseFloat(String(buyRate));
    if (sellRate !== undefined && sellRate !== null)
      updateData.sellRate = parseFloat(String(sellRate));

    const createData: CreateData = {
      currency: currency.toUpperCase(),
      rate: rate ? parseFloat(String(rate)) : 0, // compat
    };
    if (buyRate !== undefined && buyRate !== null)
      createData.buyRate = parseFloat(String(buyRate));
    if (sellRate !== undefined && sellRate !== null)
      createData.sellRate = parseFloat(String(sellRate));

    const newRate = await prisma.exchangeRate.upsert({
      where: { currency: currency.toUpperCase() },
      update: updateData,
      create: createData,
    });

    const allRates = await prisma.exchangeRate.findMany();
    await pusherServer.trigger("exchange-rates", "rates-updated", {
      rates: allRates,
    });

    return NextResponse.json(newRate, { status: 201 });
  } catch (err: unknown) {
    console.error("Error al crear tasa:", err);
    if (
      err instanceof Error &&
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string" &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Esa moneda ya existe" }, { status: 409 });
    }
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message || "Error del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
