import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID ?? "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS";

export async function PATCH(
  req: NextRequest,
  context: { params: Record<string, string> }
) {
  const orderId = context.params.id;
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const status = body?.status;

    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
