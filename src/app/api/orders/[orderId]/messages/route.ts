// app/api/orders/[orderId]/messages/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS";

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: { userId: true },
  });

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user || (user.id !== order?.userId && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { orderId: params.orderId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { fullName: true, email: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
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
      orderId: params.orderId,
    },
    include: {
      sender: { select: { fullName: true, email: true } },
    },
  });

  return NextResponse.json(message);
}
