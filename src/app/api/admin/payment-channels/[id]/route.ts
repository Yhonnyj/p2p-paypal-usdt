import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔐 Admin dinámico según entorno
const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

// PATCH /api/admin/payment-channels/[id] → actualizar campos puntuales
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = params.id;
  try {
    const body = await req.json();

    // Sanitizar numéricos si vienen como string
    const data: any = {
      label: body.label ?? undefined,
      commissionBuyPercent:
        body.commissionBuyPercent != null
          ? parseFloat(body.commissionBuyPercent)
          : undefined,
      commissionSellPercent:
        body.commissionSellPercent != null
          ? parseFloat(body.commissionSellPercent)
          : undefined,
      enabledBuy:
        typeof body.enabledBuy === "boolean" ? body.enabledBuy : undefined,
      enabledSell:
        typeof body.enabledSell === "boolean" ? body.enabledSell : undefined,
      visible: typeof body.visible === "boolean" ? body.visible : undefined,
      statusTextBuy: body.statusTextBuy ?? undefined,
      statusTextSell: body.statusTextSell ?? undefined,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      // 🔑 Nota: `key` es único, evita cambiarlo salvo que sea necesario.
      // key: body.key ? String(body.key).toUpperCase() : undefined,
    };

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando PaymentChannel:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-channels/[id] → borrar DEFINITIVAMENTE
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = params.id;

  try {
    await prisma.paymentChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: "hard" });
  } catch (error: any) {
    console.error("Error eliminando PaymentChannel:", error);

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede borrar porque está referenciado por órdenes u otras entidades.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
