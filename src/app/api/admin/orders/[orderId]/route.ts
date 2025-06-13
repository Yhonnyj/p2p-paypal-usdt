export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher"; // ✅ AÑADIDO

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID ?? "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId;
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { status } = await req.json();

    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { user: true }, // ✅ necesario para que el cliente reciba info completa
    });

    // ✅ Emitir evento a Pusher
    await pusherServer.trigger("orders-channel", "order-updated", updatedOrder);

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error("Error actualizando orden:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
