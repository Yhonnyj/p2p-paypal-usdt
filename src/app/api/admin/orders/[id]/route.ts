// src/app/api/admin/orders/[id]/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID!;

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const { userId } = await auth();

  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { id } = context.params;
    const { status } = await req.json();

    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
