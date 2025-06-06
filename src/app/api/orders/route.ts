import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Crear nueva orden
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      platform,       // Ej: "PayPal"
      destination,    // Ej: "USDT - TRC20"
      amount,
      paypalEmail,
      wallet,
    } = body;

    if (!platform || !destination || !amount || !paypalEmail || !wallet) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Buscar usuario interno usando el clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado en base de datos" }, { status: 404 });
    }

    const rate = 1.13;
    const feePercent = 13;
    const finalUsd = amount * (1 - feePercent / 100);
    const finalUsdt = finalUsd / rate;

    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
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

// GET: Listar órdenes del usuario autenticado
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado en base de datos" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error cargando órdenes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
