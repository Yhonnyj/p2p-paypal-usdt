import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // tu ID real de admin

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
    include: { user: true }, // 🔁 necesario para obtener el email
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
      from: "TuCapi <Verificaciones.noreply@managerp2p.com>",
      to: verification.user.email,
      subject,
      html,
    });
  }

  return NextResponse.json({ success: true, verification });
}
