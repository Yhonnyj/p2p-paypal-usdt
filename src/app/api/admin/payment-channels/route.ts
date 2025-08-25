import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔐 Admin dinámico según entorno
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
    const channels = await prisma.paymentChannel.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error obteniendo PaymentChannels:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      key,
      label,
      commissionBuyPercent,
      commissionSellPercent,
      enabledBuy = true,
      enabledSell = true,
      visible = true,
      statusTextBuy,
      statusTextSell,
      sortOrder = 0,
    } = body;

    if (!key || !label) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (key, label)" },
        { status: 400 }
      );
    }

    const newChannel = await prisma.paymentChannel.create({
      data: {
        key: key.toUpperCase(),
        label,
        commissionBuyPercent: parseFloat(commissionBuyPercent),
        commissionSellPercent: parseFloat(commissionSellPercent),
        enabledBuy,
        enabledSell,
        visible,
        statusTextBuy,
        statusTextSell,
        sortOrder,
      },
    });

    return NextResponse.json(newChannel);
  } catch (error) {
    console.error("Error creando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
