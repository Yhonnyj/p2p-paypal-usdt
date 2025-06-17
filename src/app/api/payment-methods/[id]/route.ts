// src/app/api/payment-methods/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

export async function DELETE(_: Request, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const method = await prisma.paymentMethod.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!method || method.user.clerkId !== clerkId) {
    return NextResponse.json({ error: "Método no encontrado o no autorizado" }, { status: 403 });
  }

  await prisma.paymentMethod.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
