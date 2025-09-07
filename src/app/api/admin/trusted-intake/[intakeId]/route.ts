// app/api/admin/trusted-intake/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resend } from "@/lib/resend";
import { pusherServer } from "@/lib/pusher";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { z } from "zod";

const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

// Esquema actualizado para manejar strings y convertirlos a números
const DecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  limits: z.object({
    maxPerTxUsd: z.union([z.number(), z.string()]).transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) throw new Error('maxPerTxUsd debe ser un número positivo');
      return num;
    }),
    maxMonthlyUsd: z.union([z.number(), z.string()]).transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) throw new Error('maxMonthlyUsd debe ser un número positivo');
      return num;
    }),
    holdHours: z.union([z.number(), z.string()]).transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 0) throw new Error('holdHours debe ser un número no negativo');
      return num;
    }),
  }).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { intakeId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verificar que el usuario es admin
  if (userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const intakeId = params.intakeId;
  console.log('IntakeId received:', intakeId); // Debug temporal
  
  try {
    // Validar body
    const raw = await req.json() as Record<string, unknown>;
    console.log('Raw body received:', raw); // Para debug
    
    const parsed = DecisionSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('Schema validation failed:', parsed.error);
      return NextResponse.json(
        { 
          error: "Datos inválidos", 
          details: parsed.error.flatten().fieldErrors,
          received: raw 
        },
        { status: 400 }
      );
    }

    const { decision, limits, notes } = parsed.data;
    console.log('Parsed data:', { decision, limits, notes }); // Para debug

    // Buscar el intake
    const intake = await prisma.trustedIntake.findUnique({
      where: { id: intakeId },
      include: { user: true }
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    // Actualizar el status del intake
    await prisma.trustedIntake.update({
      where: { id: intakeId },
      data: {
        status: decision,
        reviewerId: userId,
        decisionAt: new Date()
      }
    });

    // Si es aprobado, crear o actualizar el perfil trusted
    if (decision === "APPROVED" && limits) {
      await prisma.trustedProfile.upsert({
        where: { userId: intake.userId },
        update: {
          enabled: true,
          status: "APPROVED",
          maxPerTxUsd: new Prisma.Decimal(limits.maxPerTxUsd),
          maxMonthlyUsd: new Prisma.Decimal(limits.maxMonthlyUsd),
          holdHours: limits.holdHours,
          notes: notes || null,
          reviewerId: userId,
        },
        create: {
          userId: intake.userId,
          enabled: true,
          status: "APPROVED",
          maxPerTxUsd: new Prisma.Decimal(limits.maxPerTxUsd),
          maxMonthlyUsd: new Prisma.Decimal(limits.maxMonthlyUsd),
          holdHours: limits.holdHours,
          notes: notes || null,
          reviewerId: userId,
        }
      });
    }

    // Crear audit log
    await prisma.trustedAudit.create({
      data: {
        userId: intake.userId,
        intakeId: intakeId,
        action: decision === "APPROVED" ? "INTAKE_APPROVED" : "INTAKE_REJECTED",
        details: {
          intakeId,
          decision,
          limits: limits || null,
          notes: notes || null,
          reviewedBy: userId,
        }
      }
    });

    // Notificar al cliente por correo
    if (intake.user.email) {
      const subject = decision === "APPROVED" 
        ? "🎉 Solicitud aprobada - Programa Piloto de Pagos de Terceros"
        : "❌ Solicitud rechazada - Programa Piloto de Pagos de Terceros";

      const html = decision === "APPROVED" 
        ? `
<div style="font-family: Arial, sans-serif; background-color: #f0fdf4; padding: 24px; color: #111; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
  </div>

  <h2 style="color: #10b981;">¡Bienvenido al Programa Piloto de Pagos de Terceros! 🎉</h2>
  <p style="font-size: 16px;">Tu solicitud ha sido <strong>aprobada exitosamente</strong>. Ya puedes procesar pagos de terceros con las siguientes condiciones:</p>

  <div style="background-color: #dcfce7; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #166534; margin-top: 0;">📊 Límites Aprobados:</h3>
    <ul style="font-size: 16px; line-height: 1.6; margin: 0;">
      <li>💰 <strong>Límite por transacción:</strong> USD $${limits?.maxPerTxUsd || "N/A"}</li>
      <li>📅 <strong>Límite mensual:</strong> USD $${limits?.maxMonthlyUsd || "N/A"}</li>
      <li>⏱️ <strong>Tiempo de liberación:</strong> ${limits?.holdHours || "N/A"} horas</li>
    </ul>
  </div>

  <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #92400e; margin-top: 0;">⚠️ Recordatorio - Términos y Condiciones:</h3>
    
    <div style="margin-bottom: 12px;">
      <strong style="color: #dc2626;">⚠️ Responsabilidad por contracargos:</strong><br/>
      <span style="font-size: 14px;">Te haces responsable por cualquier contracargo que se genere por tus clientes y autorizas el descuento de montos, comisiones y costos asociados según Términos del servicio.</span>
    </div>
    
    <div style="margin-bottom: 12px;">
      <strong style="color: #059669;">✅ Uso permitido:</strong><br/>
      <span style="font-size: 14px;">Declaras que no usarás el servicio para actividades restringidas o ilícitas y que cumplirás con los requisitos KYC/KYB aplicables.</span>
    </div>
    
    <div style="margin-bottom: 12px;">
      <strong style="color: #7c3aed;">🔒 Tratamiento de datos:</strong><br/>
      <span style="font-size: 14px;">Aceptas que esta información se almacene junto a tu cuenta para evaluación de riesgo, prevención de fraude y soporte, conforme a Términos y Política de Privacidad.</span>
    </div>
  </div>

  <p style="font-size: 16px;">Puedes comenzar a usar el servicio de inmediato desde tu panel de usuario.</p>

  <p style="font-size: 16px;">Si tienes dudas sobre el programa piloto, contáctanos por WhatsApp:<br/>
  📲 <strong>+1 506 899 8648</strong> — ¡con gusto el soporte te atenderá!</p>

  <p style="font-size: 16px;">Gracias por confiar en nosotros.<br/>
  <strong>Equipo TuCapi 💬</strong></p>
</div>
`
        : `
<div style="font-family: Arial, sans-serif; background-color: #fef2f2; padding: 24px; color: #111; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
  </div>

  <h2 style="color: #dc2626;">Solicitud rechazada - Programa Piloto</h2>
  <p style="font-size: 16px; color: #444;">Tu solicitud para el Programa Piloto de Pagos de Terceros ha sido rechazada.</p>
  
  <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="font-size: 16px; color: #444; margin: 0;">
      <strong>Motivos comunes de rechazo:</strong><br/>
      • Información incompleta o incorrecta<br/>
      • Volumen de transacciones no cumple los requisitos<br/>
      • Actividad económica no elegible<br/>
      • Documentación faltante
    </p>
  </div>

  <p style="font-size: 16px; color: #444;">Puedes revisar tu información y volver a aplicar desde tu panel de usuario.</p>
  
  ${notes ? `<p style="font-size: 16px; color: #444;"><strong>Nota del revisor:</strong> ${notes}</p>` : ''}
  
  <p style="font-size: 16px; color: #444;">Si tienes dudas o necesitas ayuda, contáctanos por WhatsApp:<br/>
  📲 <strong>+1 506 899 8648</strong></p>
  
  <p style="font-size: 16px; color: #444;"><strong>Equipo TuCapi 💬</strong></p>
</div>
`;

      try {
        await resend.emails.send({
          from: "TuCapi <notificaciones@tucapi.app>",
          to: intake.user.email,
          subject,
          html,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // No fallar toda la operación por un error de email
      }
    }

    // Notificar al cliente en tiempo real
    try {
      await pusherServer.trigger(`user-${intake.user.clerkId}-trusted-intake`, "intake-updated", {
        status: decision,
        limits: decision === "APPROVED" ? limits : null,
      });
    } catch (pusherError) {
      console.error('Error with Pusher notification:', pusherError);
    }

    // Notificar con push notification si existe token
    const pushToken = intake.user.expoPushToken;
    if (pushToken) {
      try {
        await sendPushNotification(
          pushToken,
          decision === "APPROVED"
            ? "✅ Programa Piloto Aprobado"
            : "❌ Programa Piloto Rechazado",
          decision === "APPROVED"
            ? `Límites: $${limits?.maxPerTxUsd}/tx, $${limits?.maxMonthlyUsd}/mes`
            : "Revisa tu información e intenta nuevamente."
        );
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
    }

    // Notificar al admin
    try {
      await pusherServer.trigger("admin-trusted-intakes", "admin-intakes-updated", {});
    } catch (adminPusherError) {
      console.error('Error with admin Pusher notification:', adminPusherError);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error updating intake decision:', error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}