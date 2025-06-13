// src/app/api/orders/[orderId]/messages/route.ts
// Esta ruta maneja la obtención y envío de mensajes para una orden específica.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server"; // Importado NextRequest
import Pusher from "pusher"; // Importa Pusher para la funcionalidad de chat en tiempo real

// Configuración de Pusher (asegúrate de que estas variables de entorno estén definidas)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Asegúrate de que este ID sea correcto.

// GET: Obtener mensajes de una orden
export async function GET(
  req: NextRequest,
  context: { params: { orderId: string } } // Acceder a 'params' a través del objeto 'context'
) {
  // FIX: Acceder a orderId de forma explícita desde context.params
  const orderId = context.params.orderId; 
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

    // Validación de autorización: El usuario debe ser el propietario de la orden o un ADMIN.
    if (!user || (user.id !== order.userId && clerkId !== ADMIN_ID)) {
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
  } catch (error: unknown) { // Manejo de errores más robusto
    console.error("Error al obtener mensajes:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Enviar mensaje
export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } } // Acceder a 'params' a través del objeto 'context'
) {
  // FIX: Acceder a orderId de forma explícita desde context.params
  const orderId = context.params.orderId; 
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Contenido del mensaje inválido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

    // Validación de autorización: El usuario debe ser el propietario de la orden o un ADMIN.
    if (!user || (user.id !== order.userId && clerkId !== ADMIN_ID)) {
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

    // Publicar el nuevo mensaje a Pusher
    await pusher.trigger(`order-${orderId}`, "new-message", message);

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) { // Manejo de errores más robusto
    console.error("Error al enviar mensaje:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
