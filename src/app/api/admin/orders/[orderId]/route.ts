export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { resend } from "@/lib/resend";
import { sendPushNotification } from "@/lib/sendPushNotification";


const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID ?? "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

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
    const normalizedStatus = status.toUpperCase();
    console.log("🆕 Nuevo estado recibido:", normalizedStatus);

    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(normalizedStatus)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: normalizedStatus },
      include: { user: true },
    });


    const pushToken = updatedOrder.user.expoPushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    normalizedStatus === "COMPLETED"
      ? "✅ Tu orden fue completada"
      : normalizedStatus === "CANCELLED"
      ? "❌ Tu orden fue cancelada"
      : "📦 Estado de orden actualizado",
    normalizedStatus === "COMPLETED"
      ? "Gracias por usar TuCapi. Tu orden fue procesada exitosamente."
      : normalizedStatus === "CANCELLED"
      ? "Tu orden fue cancelada. Puedes crear una nueva cuando gustes."
      : `El estado de tu orden cambió a ${normalizedStatus}.`
  );
}

    // Notificar por Pusher
    await pusherServer.trigger("orders-channel", "order-updated", updatedOrder);

   // Enviar email al cliente si se completó la orden
if (normalizedStatus === "COMPLETED" && updatedOrder.user.email) {
  await resend.emails.send({
    from: "TuCapi te informa que la orden fue completada. <ordenes.noreply@tucapi.com>",
    to: updatedOrder.user.email,
    subject: "✅ Tu orden ha sido completada",
    html: `
      <h2>¡Gracias por tu pedido!</h2>
      <p>Tu orden en nuestra plataforma ha sido completada con éxito.</p>
      <p><strong>Monto enviado:</strong> $${updatedOrder.amount.toFixed(2)}</p>
      <p><strong>Destino:</strong> ${updatedOrder.to}</p>
      <p>Este es un correo automatico, no responder este correo.</p>
      <p><em>Fecha:</em> ${new Date(updatedOrder.updatedAt).toLocaleString("es-ES")}</p>
    `,
  });
}


    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error("Error actualizando orden:", error);
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
