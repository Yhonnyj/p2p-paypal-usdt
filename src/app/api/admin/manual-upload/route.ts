import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { resend } from "@/lib/resend";

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId, documentUrl, selfieUrl } = body;

  if (!targetUserId || !documentUrl || !selfieUrl) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  try {
    const verification = await prisma.verification.upsert({
      where: { userId: targetUserId },
      update: {
        documentUrl,
        selfieUrl,
        status: "PENDING",
      },
      create: {
        userId: targetUserId,
        documentUrl,
        selfieUrl,
        status: "PENDING",
      },
      include: { user: true },
    });

    // 🔔 Notificar al cliente en tiempo real
    await pusherServer.trigger(`user-${verification.user.clerkId}-verification`, "verification-updated", {
      status: "PENDING",
    });

    // 🔔 Notificar por push si tiene token
    const pushToken = verification.user.expoPushToken;
    if (pushToken) {
      await sendPushNotification(
        pushToken,
        "🕒 Verificación en proceso",
        "Tu verificación fue cargada por soporte y está en revisión."
      );
    }

    // 📧 Notificar por correo
    if (verification.user.email) {
      await resend.emails.send({
        from: "TuCapi <notificaciones@tucapi.app>",
        to: verification.user.email,
        subject: "🕒 Verificación cargada por soporte",
        html: `
          <h2>Tu verificación ha sido cargada</h2>
          <p>Un miembro del equipo ha subido tus documentos manualmente. En breve serán revisados.</p>
        `,
      });
    }

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("[MANUAL_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
