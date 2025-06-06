
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      platform, // "PayPal"
      destination, // "USDT - TRC20"
      amount,
      paypalEmail,
      wallet,
    } = body;

    if (!platform || !destination || !amount || !paypalEmail || !wallet) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const rate = 1.13;
    const feePercent = 13;
    const finalUsd = amount * (1 - feePercent / 100);
    const finalUsdt = finalUsd / rate;

    const order = await prisma.order.create({
  data: {
    userId,
    platform,
    to: destination,
    amount,
    finalUsd,
    finalUsdt,
    paypalEmail,
    wallet,
    status: "PENDING",
  },
});


    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
