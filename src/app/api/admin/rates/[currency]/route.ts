import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Reemplaza con tu ID real

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

    // 🔔 Notificar a todos los clientes conectados
    const allRates = await prisma.exchangeRate.findMany();
    await pusherServer.trigger("exchange-rates", "rates-updated", {
      rates: allRates,
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("Error actualizando tasa:", err);
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message || "Moneda no encontrada o error del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Moneda no encontrada o error del servidor" },
      { status: 500 }
    );
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
  } catch (err: unknown) {
    console.error("Error al eliminar tasa:", err);
    if (err instanceof Error && "code" in err && (err as any).code === "P2025") {
      return NextResponse.json({ error: "La moneda no existe." }, { status: 404 });
    }
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message || "No se pudo eliminar la moneda" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo eliminar la moneda" },
      { status: 500 }
    );
  }
}
