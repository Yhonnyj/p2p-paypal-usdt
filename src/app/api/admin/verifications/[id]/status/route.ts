import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { pusherServer } from "@/lib/pusher"; // ✅ NUEVO
import { NextResponse } from "next/server";

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
        ? "✅ Verificación aprobada"
        : "❌ Verificación rechazada";

    const html =
      status === "APPROVED"
        ? `
      <h2>¡Tu verificación fue aprobada!</h2>
      <p>Ahora puedes usar todos los servicios de la plataforma sin restricciones.</p>
      `
        : `
      <h2>Tu verificación fue rechazada</h2>
      <p>Revisa que los documentos sean legibles y estén completos. Puedes intentarlo nuevamente.</p>
      `;

    await resend.emails.send({
      from: "TuCapi <Verificaciones.noreply@tucapi.com>",
      to: verification.user.email,
      subject,
      html,
    });
  }

  // ✅ Notificar al cliente en tiempo real
  await pusherServer.trigger(`user-${verification.user.clerkId}-verification`, "verification-updated", {
  status: verification.status,
});


// ✅ Notificar al admin
await pusherServer.trigger("admin-verifications", "admin-verifications-updated", {});


  return NextResponse.json({ success: true, verification });
}
