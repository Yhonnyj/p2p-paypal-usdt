// app/api/admin/payment-channels/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 🔐 Admin dinámico según entorno
const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

function isAdmin(userId?: string | null): boolean {
  if (!ADMIN_CLERK_ID) return false;
  return userId === ADMIN_CLERK_ID;
}

// ==== Tipos de ayuda ====
type PatchBody = Partial<{
  label: string;
  commissionBuyPercent: number | string;
  commissionSellPercent: number | string;
  providerFeePercent: number | string;
  enabledBuy: boolean;
  enabledSell: boolean;
  visible: boolean;
  statusTextBuy: string | null;
  statusTextSell: string | null;
  sortOrder: number | string;
  // key?: string; // evitar cambiarlo salvo necesidad
}>;

// PATCH /api/admin/payment-channels/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  try {
    // existe?
    const exists = await prisma.paymentChannel.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const body = (await req.json()) as PatchBody;

    // Construimos un objeto tipado para Prisma
    const data: Prisma.PaymentChannelUpdateInput = {
      label: body.label?.trim() ?? undefined,

      commissionBuyPercent:
        body.commissionBuyPercent !== undefined
          ? Number(body.commissionBuyPercent)
          : undefined,

      commissionSellPercent:
        body.commissionSellPercent !== undefined
          ? Number(body.commissionSellPercent)
          : undefined,

      providerFeePercent:
        body.providerFeePercent !== undefined
          ? Number(body.providerFeePercent)
          : undefined,

      enabledBuy:
        typeof body.enabledBuy === "boolean" ? body.enabledBuy : undefined,

      enabledSell:
        typeof body.enabledSell === "boolean" ? body.enabledSell : undefined,

      visible: typeof body.visible === "boolean" ? body.visible : undefined,

      statusTextBuy:
        body.statusTextBuy === null
          ? null
          : body.statusTextBuy?.trim() ?? undefined,

      statusTextSell:
        body.statusTextSell === null
          ? null
          : body.statusTextSell?.trim() ?? undefined,

      sortOrder:
        body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,

      // key: body.key ? String(body.key).toUpperCase() : undefined,
    };

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    // unique, etc.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Conflicto de unicidad (key duplicado)" },
        { status: 409 }
      );
    }
    console.error("Error actualizando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/payment-channels/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  try {
    await prisma.paymentChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: "hard" });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // violación de FK (hay órdenes apuntando a este channel)
      return NextResponse.json(
        {
          error:
            "No se puede borrar: el canal está referenciado por órdenes u otras entidades.",
        },
        { status: 409 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      // no encontrado al borrar
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    console.error("Error eliminando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
