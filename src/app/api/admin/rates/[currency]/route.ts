import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // tu ID real

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
  } catch (err: any) {
    console.error("Error actualizando tasa:", err);
    return NextResponse.json({ error: "Moneda no encontrada o error" }, { status: 500 });
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
  } catch (err: any) {
    console.error("Error al eliminar tasa:", err);
    return NextResponse.json({ error: "No se pudo eliminar la moneda" }, { status: 500 });
  }
}
