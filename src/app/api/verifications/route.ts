import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher"; // ✅ Import agregado

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { documentUrl, selfieUrl } = await req.json();

    if (!documentUrl || !selfieUrl) {
      return NextResponse.json({ error: "Faltan URLs de imágenes" }, { status: 400 });
    }

    const verification = await prisma.verification.upsert({
      where: { userId: user.id },
      update: {
        documentUrl,
        selfieUrl,
        status: "PENDING",
      },
      create: {
        userId: user.id,
        documentUrl,
        selfieUrl,
        status: "PENDING",
      },
    });

    // ✅ Emitir evento a Pusher para que el cliente vea "PENDING" en tiempo real
    await pusherServer.trigger(
      `user-${user.clerkId}-verification`,
      "verification-updated",
      { status: "PENDING" }
    );

    // ✅ Enviar email al admin
    await resend.emails.send({
      from: "Nueva verificacion <notificaciones@tucapi.app>",
      to: "info@caibo.ca",
      subject: `🔐 Verificación pendiente: ${user.fullName || user.email}`,
      html: `
        <h2>Nuevo cliente esperando revisión</h2>
        <p><strong>Nombre:</strong> ${user.fullName || "Sin nombre"}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
      `,
    });

    // ✅ Push al admin si tiene token
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: process.env.ADMIN_CLERK_ID },
      select: { expoPushToken: true },
    });

    if (adminUser?.expoPushToken) {
      await sendPushNotification(
        adminUser.expoPushToken,
        "🔐 Nueva verificación recibida",
        `${user.fullName || user.email} envió documentos.`
      );
    }

    return NextResponse.json(verification);
  } catch (error) {
    console.error("❌ Error al guardar verificación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
