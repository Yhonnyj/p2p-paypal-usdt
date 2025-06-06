// app/api/orders/[orderId]/messages/route.ts

// ✅ Forzar modo dinámico para evitar error de pre-render en build
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ID = process.env.ADMIN_CLERK_ID ?? "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS";

// GET: Obtener mensajes de una orden
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user || (user.id !== order?.userId && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { fullName: true, email: true } },
    },
  });

  return NextResponse.json(messages);
}

// POST: Enviar mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user || (user.id !== order?.userId && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId: user.id,
      orderId,
    },
    include: {
      sender: { select: { fullName: true, email: true } },
    },
  });

  // ✅ Emitir mensaje por Pusher
  await pusherServer.trigger(`order-${orderId}`, "new-message", message);

  return NextResponse.json(message);
}
