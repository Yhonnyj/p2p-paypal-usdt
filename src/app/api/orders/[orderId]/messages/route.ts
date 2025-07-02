import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

type MessagePayload = {
  id: string;
  content: string | null;
  imageUrl?: string;
  createdAt: string;
  sender: {
    fullName: string | null;
    email: string;
    id: string;
  };
  senderId: string;
  orderId: string;
};

// ✅ GET: Obtener mensajes y email del usuario de la orden
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
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

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

    return NextResponse.json({
      order,
      messages,
    });
  } catch (error: unknown) {
    console.error("Error al obtener mensajes:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Error interno del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ✅ POST: Enviar mensaje (texto o imagen)
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
    const { content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío (sin texto ni imagen)" },
        { status: 400 }
      );
    }

    if (content !== null && typeof content !== "string" && content !== undefined) {
      return NextResponse.json({ error: "El contenido de texto es inválido" }, { status: 400 });
    }

    if (imageUrl !== null && typeof imageUrl !== "string" && imageUrl !== undefined) {
      return NextResponse.json({ error: "La URL de la imagen es inválida" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user || (user.id !== order.userId && clerkId !== ADMIN_ID)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content: content === "" ? null : content,
        imageUrl: imageUrl || null,
        senderId: user.id,
        orderId,
      },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
    });

    const messageToPusher: MessagePayload = {
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl || undefined,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        fullName: message.sender.fullName,
        email: message.sender.email,
      },
      senderId: message.sender.id,
      orderId: message.orderId,
    };

    await pusher.trigger(`order-${orderId}`, "new-message", messageToPusher);

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al enviar mensaje:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Error interno del servidor" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
