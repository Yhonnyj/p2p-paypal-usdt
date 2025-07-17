import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { pusherServer } from "@/lib/pusher"; // ✅ NUEVO
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/sendPushNotification";

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = context.params;
  const { status } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const verification = await prisma.verification.update({
    where: { id },
    data: { status },
    include: { user: true },
  });


  
  // ✅ Notificar al cliente por correo
  if (verification.user.email) {
    const subject =
      status === "APPROVED"
        ? "🎉 Verificación aprobada"
        : "❌ Verificación rechazada";


   const html =
  status === "APPROVED"
    ? `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
  </div>

  <h2 style="color: #10b981;">¡Tu verificación ha sido aprobada exitosamente! 🎉</h2>
  <p style="font-size: 16px;">Ya puedes comenzar a operar en nuestra plataforma de forma segura, rápida y con atención personalizada.</p>

  <p style="font-size: 16px;">Queremos darte la bienvenida con una oferta especial:</p>

  <ul style="font-size: 16px; line-height: 1.6; padding-left: 20px;">
    <li>🔹 50% de descuento en la cotización del día en tu primera operación.</li>
    <li>🔹 En tu 5ta operación, te aplicaremos 18% de descuento en la comisión.</li>
    <li>🔹 Y a partir de tu 15ta operación, accedes a una comisión fija con 10%  de descuento por fidelidad 💛</li>
  </ul>

  <p style="font-size: 16px;">Somos la única plataforma en ofrecer estos regalos por fidelidad.<br/>
  Además, puedes cambiar tu saldo PayPal a bolívares o USDT, según lo que necesites.</p>

  <p style="font-size: 16px;">Cualquier duda, escríbenos por WhatsApp:<br/>
  📲 <strong>+1 506 899 8648</strong> — ¡con gusto el soporte te atenderá!</p>

  <p style="font-size: 16px;">Gracias por confiar en nosotros.<br/>
  <strong>Equipo TuCapi 💬</strong></p>
</div>
`
    : `
<div style="font-family: Arial, sans-serif; background-color: #fff5f5; padding: 24px; color: #990000; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
  </div>

  <h2 style="color: #e11d48;">Tu verificación fue rechazada</h2>
  <p style="font-size: 16px; color: #444;">Revisa que los documentos sean legibles, estén completos y no borrosos.</p>
  <p style="font-size: 16px; color: #444;">Puedes intentarlo nuevamente desde tu panel de usuario.</p>
  <p style="font-size: 16px; color: #444;">Si necesitas ayuda o tienes dudas, contáctanos por WhatsApp:<br/>
  📲 <strong>+1 506 899 8648</strong></p>
  <p style="font-size: 16px; color: #444;"><strong>Equipo TuCapi 💬</strong></p>
</div>
`;

await resend.emails.send({
  from: "TuCapi <notificaciones@tucapi.app>",
  to: verification.user.email,
  subject,
  html,
});
  }

  // ✅ Notificar al cliente en tiempo real
  await pusherServer.trigger(`user-${verification.user.clerkId}-verification`, "verification-updated", {
  status: verification.status,
});


const pushToken = verification.user.expoPushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    status === "APPROVED"
      ? "✅ Verificación aprobada"
      : "❌ Verificación rechazada",
    status === "APPROVED"
      ? "Ahora puedes usar todos los servicios de TuCapi."
      : "Revisa tus documentos y vuelve a intentarlo."
  );
}


// ✅ Notificar al admin
await pusherServer.trigger("admin-verifications", "admin-verifications-updated", {});


  return NextResponse.json({ success: true, verification });
}
