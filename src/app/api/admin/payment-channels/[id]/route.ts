import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 🔐 Admin dinámico según entorno
const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

// ==== Tipos de ayuda ====
type PatchBody = Partial<{
  label: string;
  commissionBuyPercent: number | string;
  commissionSellPercent: number | string;
  enabledBuy: boolean;
  enabledSell: boolean;
  visible: boolean;
  statusTextBuy: string | null;
  statusTextSell: string | null;
  sortOrder: number | string;
  // key?: string; // evitar cambiarlo salvo necesidad
}>;

// PATCH /api/admin/payment-channels/[id] → actualizar campos puntuales
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = (await req.json()) as PatchBody;

    // Construimos un objeto tipado para Prisma
    const data: Prisma.PaymentChannelUpdateInput = {
      label: body.label ?? undefined,
      commissionBuyPercent:
        body.commissionBuyPercent != null
          ? Number(body.commissionBuyPercent)
          : undefined,
      commissionSellPercent:
        body.commissionSellPercent != null
          ? Number(body.commissionSellPercent)
          : undefined,
      enabledBuy:
        typeof body.enabledBuy === "boolean" ? body.enabledBuy : undefined,
      enabledSell:
        typeof body.enabledSell === "boolean" ? body.enabledSell : undefined,
      visible: typeof body.visible === "boolean" ? body.visible : undefined,
      statusTextBuy:
        body.statusTextBuy === null
          ? null
          : body.statusTextBuy ?? undefined,
      statusTextSell:
        body.statusTextSell === null
          ? null
          : body.statusTextSell ?? undefined,
      sortOrder:
        body.sortOrder != null ? Number(body.sortOrder) : undefined,
      // key: body.key ? String(body.key).toUpperCase() : undefined, // evitar cambiarlo salvo necesidad
    };

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error actualizando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
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

  const { id } = params;

  try {
    await prisma.paymentChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: "hard" });
  } catch (error: unknown) {
    console.error("Error eliminando PaymentChannel:", error);

    // Manejo fino de errores Prisma (foreign keys, etc.)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede borrar porque está referenciado por órdenes u otras entidades.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
