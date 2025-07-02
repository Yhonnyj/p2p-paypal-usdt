import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const { userId: clerkId } = await auth();
  const orderId = params.orderId;

  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== dbUser.id) {
    return NextResponse.json({ error: "Orden no válida o no autorizada" }, { status: 403 });
  }

  // ⚠️ Verificar si ya existe un mensaje de confirmación
  const existingMessage = await prisma.message.findFirst({
    where: {
      orderId,
      content: "🟡 El cliente indicó que ya realizó el pago en PayPal.",
    },
  });

  if (existingMessage) {
    return NextResponse.json({ success: true, alreadyConfirmed: true });
  }

  // ✅ Crear mensaje en la DB
  const message = await prisma.message.create({
    data: {
      orderId,
      senderId: dbUser.id,
      content: "🟡 El cliente indicó que ya realizó el pago en PayPal.",
    },
    include: {
      sender: { select: { id: true, fullName: true, email: true } },
    },
  });

  // ✅ Emitir por Pusher
  await pusherServer.trigger(`order-${orderId}`, "new-message", {
    id: message.id,
    content: message.content,
    imageUrl: null,
    createdAt: message.createdAt.toISOString(),
    sender: {
      id: dbUser.id,
      fullName: message.sender.fullName,
      email: message.sender.email,
    },
    senderId: dbUser.id,
    orderId,
  });

  return NextResponse.json({ success: true });
}
