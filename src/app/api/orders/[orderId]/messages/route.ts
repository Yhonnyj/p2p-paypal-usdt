// src/app/api/orders/[orderId]/messages/route.ts
// Esta ruta maneja la obtención y envío de mensajes (texto e imágenes) para una orden específica.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import Pusher from "pusher"; // Importa Pusher para la funcionalidad de chat en tiempo real

// Configuración de Pusher (asegúrate de que estas variables de entorno estén definidas)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Asegúrate de que este ID sea correcto para tu administrador

// --- ACTUALIZADO: Tipo de Mensaje para incluir imágenes ---
// Este tipo representa la estructura completa del mensaje tal como se almacenará
// y se enviará a través de Pusher.
type MessagePayload = {
  id: string; // ID único del mensaje
  content: string | null; // El contenido de texto, puede ser nulo si es solo imagen
  imageUrl?: string; // URL de la imagen, opcional
  createdAt: string; // Fecha de creación del mensaje
  sender: {
    fullName: string | null;
    email: string;
    id: string; // ID del remitente
  };
  senderId: string; // ID del remitente en tu DB (para el payload de Pusher si se necesita)
  orderId: string; // ID de la orden a la que pertenece el mensaje
};


// GET: Obtener mensajes de una orden
export async function GET(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
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
  } catch (error: unknown) {
    console.error("Error al obtener mensajes:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Enviar mensaje (ahora puede incluir texto y/o URL de imagen)
export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, imageUrl } = body; // <-- Ahora esperamos 'imageUrl' del frontend

    // --- Validación: Debe haber al menos contenido de texto o una URL de imagen ---
    if (!content && !imageUrl) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío (sin texto ni imagen)" }, { status: 400 });
    }
    // Asegurarse de que 'content' sea un string o nulo si existe
    if (content !== null && typeof content !== "string" && content !== undefined) {
        return NextResponse.json({ error: "El contenido de texto es inválido" }, { status: 400 });
    }
    // Asegurarse de que 'imageUrl' sea un string o nulo si existe
    if (imageUrl !== null && typeof imageUrl !== "string" && imageUrl !== undefined) {
        return NextResponse.json({ error: "La URL de la imagen es inválida" }, { status: 400 });
    }
    // --- Fin de validación ---

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

    // Crear el mensaje en la base de datos
    const message = await prisma.message.create({
      data: {
        content: content === '' ? null : content, // Guarda null si el frontend envía un string vacío, o el contenido
        imageUrl: imageUrl || null, // Guarda la URL de la imagen o null si no hay
        senderId: user.id,
        orderId,
      },
      include: {
        sender: { select: { id: true, fullName: true, email: true } }, // Incluye ID del sender para el payload de Pusher
      },
    });

    // Publicar el nuevo mensaje a Pusher
    // El mensaje enviado a Pusher debe coincidir con el tipo Message del frontend (en ModalChat.tsx)
    const messageToPusher: MessagePayload = {
        id: message.id,
        content: message.content, // Ya es string o null de la DB
        imageUrl: message.imageUrl || undefined, // Asegúrate de que sea 'undefined' si es nulo para el tipo frontend
        createdAt: message.createdAt.toISOString(), // Convierte a ISO string para que el frontend lo parsee
        sender: {
            id: message.sender.id, // El ID del sender es importante para identificarlo en el frontend
            fullName: message.sender.fullName,
            email: message.sender.email,
        },
        senderId: message.sender.id, // Esto puede ser redundante si ya está en sender, pero se mantiene por compatibilidad si el frontend lo espera
        orderId: message.orderId,
    };

    await pusher.trigger(`order-${orderId}`, "new-message", messageToPusher);

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al enviar mensaje:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
