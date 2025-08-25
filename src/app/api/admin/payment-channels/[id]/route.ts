import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔐 Admin dinámico según entorno
const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

// PATCH /api/admin/payment-channels/[id]  → actualizar campos puntuales
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
      enabledBuy: typeof body.enabledBuy === "boolean" ? body.enabledBuy : undefined,
      enabledSell: typeof body.enabledSell === "boolean" ? body.enabledSell : undefined,
      visible: typeof body.visible === "boolean" ? body.visible : undefined,
      statusTextBuy: body.statusTextBuy ?? undefined,
      statusTextSell: body.statusTextSell ?? undefined,
      sortOrder:
        body.sortOrder != null ? Number(body.sortOrder) : undefined,
      // Nota: key es único; evita cambiarlo salvo que lo necesites.
      // key: body.key ? String(body.key).toUpperCase() : undefined,
      archivedAt:
        body.archivedAt === null ? null : undefined, // permitir desarchivar si mandas null
    };

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/payment-channels/[id]?mode=soft|hard
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = params.id;
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "soft").toLowerCase();

  try {
    if (mode === "hard") {
      await prisma.paymentChannel.delete({ where: { id } });
      return NextResponse.json({ ok: true, deleted: "hard" });
    }

    const archived = await prisma.paymentChannel.update({
      where: { id },
      data: { archivedAt: new Date(), visible: false, enabledBuy: false, enabledSell: false },
    });
    return NextResponse.json({ ok: true, deleted: "soft", id: archived.id });
  } catch (error) {
    console.error("Error eliminando/archivando PaymentChannel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
