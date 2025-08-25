export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { resend } from "@/lib/resend";
import { sendPushNotification } from "@/lib/sendPushNotification";

const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

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

    // ✅ Asignar $5 al referidor si aplica
    if (normalizedStatus === "COMPLETED") {
      const completedCount = await prisma.order.count({
        where: { userId: updatedOrder.userId, status: "COMPLETED" },
      });

      if (completedCount === 1 && updatedOrder.user.referrerId) {
        const yaPagado = await prisma.referralEarning.findFirst({
          where: { referredUserId: updatedOrder.userId },
        });

        if (!yaPagado) {
          await prisma.referralEarning.create({
            data: {
              userId: updatedOrder.user.referrerId,
              referredUserId: updatedOrder.userId,
              amount: 5.0,
            },
          });
          console.log("💸 Se otorgaron 5 USDT al referidor.");
        }
      }
    }

    // Notificación push
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

    // Pusher: Actualización en vivo
    await pusherServer.trigger("orders-channel", "order-updated", updatedOrder);

    // Enviar email al cliente si se completó la orden
    if (normalizedStatus === "COMPLETED" && updatedOrder.user.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
          </div>
          <h2 style="color: #10b981; text-align: center;">¡Gracias por tu pedido en TuCapi! 🎉</h2>
          <p style="font-size: 16px; text-align: center;">Nos complace informarte que tu orden ha sido <strong>completada con éxito</strong>.</p>
          <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #ddd;">
            <p style="font-size: 16px; margin: 4px 0;"><strong>Monto enviado:</strong> $${updatedOrder.amount.toFixed(2)}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Destino:</strong> ${updatedOrder.to}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Fecha de finalización:</strong> ${new Date(updatedOrder.updatedAt).toLocaleString("es-ES")}</p>
          </div>
          <p style="font-size: 16px; text-align: center;">Recuerda que siempre estamos listos para ayudarte. Si tienes alguna duda sobre tu orden, contáctanos por WhatsApp:<br/>📲 <strong>+1 506 899 8648</strong></p>
          <p style="font-size: 16px; text-align: center;">¡Gracias por confiar en <strong>TuCapi</strong>! 💛</p>
        </div>
      `;

      await resend.emails.send({
        from: "TuCapi <notificaciones@tucapi.app>",
        to: updatedOrder.user.email,
        subject: "✅ Tu orden en TuCapi ha sido completada",
        html,
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
