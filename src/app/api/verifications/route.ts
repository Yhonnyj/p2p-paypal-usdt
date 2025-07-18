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
  from: "Nueva verificación <notificaciones@tucapi.app>",
  to: "info@caibo.ca",
  subject: `🔐 Verificación pendiente: ${user.fullName || user.email}`,
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
      </div>

      <h2 style="color: #eab308; text-align: center;">🔐 Nueva verificación pendiente</h2>
      <p style="font-size: 16px; text-align: center;">
        Un cliente está esperando que revises su verificación de identidad.
      </p>

      <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #ddd;">
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Nombre:</strong> ${user.fullName || "Sin nombre"}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Email:</strong> ${user.email}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}
        </p>
      </div>

      <p style="font-size: 16px; text-align: center;">
        Ingresa al panel de administración para revisar y aprobar la verificación.
      </p>

      <p style="font-size: 16px; text-align: center;">
        <strong>Equipo TuCapi 💬</strong>
      </p>
    </div>
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
