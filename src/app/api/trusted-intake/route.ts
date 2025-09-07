import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resend } from "@/lib/resend";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

// Función para obtener información de geolocalización por IP
async function getIpLocation(ip: string): Promise<{ country: string; region: string; city: string } | null> {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json() as {
      status: string;
      country: string;
      regionName: string;
      city: string;
    };
    
    if (data.status === 'success') {
      return {
        country: data.country,
        region: data.regionName, 
        city: data.city
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching IP location:', error);
    return null;
  }
}

// ===== Helpers tipados =====
const toDecimal = (v: string | number | null | undefined): Prisma.Decimal | null => {
  if (v === undefined || v === null || v === "") return null;
  return new Prisma.Decimal(String(v));
};

// Zod hace el coerce de string/"on"/"1" → boolean
const BodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  phone: z.string().optional().nullable(),

  occupation: z.string().min(1),
  contributorType: z.enum(["COMPANY", "FREELANCER"]),
  companyName: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  country: z.string().min(1),

  txPerMonth: z.coerce.number().int().nonnegative(),
  avgPerTxUsd: z.coerce.number().nonnegative(),
  rangeMinUsd: z.coerce.number().nonnegative().optional().nullable(),
  rangeMaxUsd: z.coerce.number().nonnegative().optional().nullable(),
  monthlyTotalUsd: z.coerce.number().nonnegative(),

  serviceDescription: z.string().min(1),
  clientsType: z.enum(["PERSONS", "COMPANIES", "MIXED"]).optional().nullable(),
  clientsCountries: z.string().optional().nullable(),

  acceptsChargebackLiability: z.coerce.boolean(),
  acceptsAllowedUse: z.coerce.boolean(),
  acceptsDataProcessing: z.coerce.boolean(),
  // Permite notas libres (opcional)
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync user
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.local`;
  const fullName =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.username ||
    null;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, fullName },
    create: { clerkId: userId, email, fullName },
  });

  // Parse/validate body
  const raw = (await req.json()) as Record<string, unknown>;
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const b = parsed.data;

  // IP / UA
  const h = await headers();
  const ip =
    (h.get("x-real-ip") ||
      h.get("x-forwarded-for")?.split(",")[0] ||
      h.get("cf-connecting-ip") ||
      h.get("x-client-ip") ||
      "") as string;
  const userAgent = h.get("user-agent") ?? "";

  // Obtener información de geolocalización
  let ipLocation = null;
  if (ip) {
    ipLocation = await getIpLocation(ip);
  }

  // Create intake + audit
  const created = await prisma.trustedIntake.create({
    data: {
      userId: user.id,
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email,
      username: b.username,
      phone: b.phone ?? null,

      occupation: b.occupation,
      contributorType: b.contributorType,
      companyName: b.companyName ?? null,
      website: b.website ?? null,
      country: b.country,

      txPerMonth: b.txPerMonth,
      avgPerTxUsd: new Prisma.Decimal(String(b.avgPerTxUsd)),
      rangeMinUsd: toDecimal(b.rangeMinUsd ?? null),
      rangeMaxUsd: toDecimal(b.rangeMaxUsd ?? null),
      monthlyTotalUsd: new Prisma.Decimal(String(b.monthlyTotalUsd)),

      serviceDescription: b.serviceDescription,
      clientsType: b.clientsType ?? null,
      clientsCountries: b.clientsCountries ?? null,

      acceptsChargebackLiability: b.acceptsChargebackLiability,
      acceptsAllowedUse: b.acceptsAllowedUse,
      acceptsDataProcessing: b.acceptsDataProcessing,

      ip,
      userAgent,
      
      // Agregar información de geolocalización
      ipCountry: ipLocation?.country || null,
      ipCity: ipLocation?.city || null,
      ipRegion: ipLocation?.region || null,

      audits: {
        create: {
          userId: user.id,
          action: "INTAKE_SUBMITTED",
          details: { 
            notes: b.notes ?? null,
            ipLocation: ipLocation ? {
              country: ipLocation.country,
              city: ipLocation.city,
              region: ipLocation.region
            } : null
          },
        },
      },
    },
  });

  // Notificar al admin por email sobre nueva solicitud
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tucapi.app";
  
  try {
    await resend.emails.send({
      from: "TuCapi <notificaciones@tucapi.app>",
      to: "info@caibo.ca",  
      subject: "🔔 Nueva solicitud - Programa Piloto de Pagos de Terceros",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #111; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
  </div>

  <h2 style="color: #1f2937;">Nueva Solicitud Recibida 📋</h2>
  <p style="font-size: 16px;">Programa Piloto de Pagos de Terceros.</p>

  <div style="background-color: #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #374151; margin-top: 0;">👤 Información del Solicitante:</h3>
    <ul style="font-size: 14px; line-height: 1.6; margin: 0;">
      <li><strong>Nombre:</strong> ${b.firstName} ${b.lastName}</li>
      <li><strong>Email:</strong> ${b.email}</li>
      <li><strong>Usuario:</strong> @${b.username}</li>
      <li><strong>País:</strong> ${b.country}</li>
      <li><strong>Ocupación:</strong> ${b.occupation}</li>
      <li><strong>Tipo:</strong> ${b.contributorType}</li>
      ${b.phone ? `<li><strong>Teléfono:</strong> ${b.phone}</li>` : ''}
      ${b.companyName ? `<li><strong>Empresa:</strong> ${b.companyName}</li>` : ''}
    </ul>
  </div>

  <div style="background-color: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin-top: 0;">💰 Volumen Solicitado:</h3>
    <ul style="font-size: 14px; line-height: 1.6; margin: 0;">
      <li><strong>Transacciones/mes:</strong> ${b.txPerMonth}</li>
      <li><strong>Promedio por tx:</strong> USD $${b.avgPerTxUsd}</li>
      <li><strong>Total mensual:</strong> USD $${b.monthlyTotalUsd}</li>
      ${b.rangeMinUsd ? `<li><strong>Mínimo:</strong> USD $${b.rangeMinUsd}</li>` : ''}
      ${b.rangeMaxUsd ? `<li><strong>Máximo:</strong> USD $${b.rangeMaxUsd}</li>` : ''}
    </ul>
  </div>

  <div style="background-color: #f3e8ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #7c3aed; margin-top: 0;">💼 Servicio:</h3>
    <p style="font-size: 14px; margin: 0;"><strong>${b.serviceDescription}</strong></p>
    ${b.clientsType ? `<p style="font-size: 14px; margin: 8px 0 0 0;">Tipo de clientes: ${b.clientsType}</p>` : ''}
    ${b.clientsCountries ? `<p style="font-size: 14px; margin: 8px 0 0 0;">Países: ${b.clientsCountries}</p>` : ''}
  </div>

  ${ipLocation ? `
  <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #92400e; margin-top: 0;">🌍 Información de Ubicación:</h3>
    <ul style="font-size: 14px; line-height: 1.6; margin: 0;">
      <li><strong>IP:</strong> ${ip}</li>
      <li><strong>Ubicación:</strong> ${ipLocation.city}, ${ipLocation.region}, ${ipLocation.country}</li>
    </ul>
  </div>
  ` : ''}

  <div style="background-color: #dcfce7; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #166534; margin-top: 0;">✅ Declaraciones Aceptadas:</h3>
    <ul style="font-size: 14px; line-height: 1.6; margin: 0;">
      <li>✅ Responsabilidad por contracargos</li>
      <li>✅ Uso permitido</li>
      <li>✅ Tratamiento de datos</li>
    </ul>
  </div>

  <p style="font-size: 16px;">
    <strong>ID de Solicitud:</strong> ${created.id}<br/>
    <strong>Fecha:</strong> ${new Date().toLocaleString()}
  </p>

  <div style="text-align: center; margin-top: 24px;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/thirdform" 
       style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Ver en Panel Admin
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 16px;">
    <strong>Equipo TuCapi - Sistema Administrativo</strong>
  </p>
</div>
`
    });
  } catch (emailError) {
    console.error('Error sending admin notification email:', emailError);
    // No fallar la request si el email falla
  }

  // Notificar al admin en tiempo real
  try {
    await pusherServer.trigger("admin-trusted-intakes", "new-intake-received", {
      intakeId: created.id,
      applicant: `${b.firstName} ${b.lastName}`,
      email: b.email,
      country: b.country,
      monthlyVolume: b.monthlyTotalUsd,
      timestamp: new Date().toISOString()
    });
  } catch (pusherError) {
    console.error('Error sending pusher notification:', pusherError);
    // No fallar la request si pusher falla
  }

  return NextResponse.json({ ok: true, intakeId: created.id });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync user
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.local`;
  const fullName =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.username ||
    null;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, fullName },
    create: { clerkId: userId, email, fullName },
  });

  // Buscar el intake más reciente del usuario
  const intake = await prisma.trustedIntake.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!intake) {
    return NextResponse.json({ ok: true, intake: null });
  }

  return NextResponse.json({
    ok: true,
    intake: {
      id: intake.id,
      status: intake.status,
      firstName: intake.firstName,
      lastName: intake.lastName,
      email: intake.email,
      username: intake.username,
      phone: intake.phone,
      occupation: intake.occupation,
      contributorType: intake.contributorType,
      companyName: intake.companyName,
      website: intake.website,
      country: intake.country,
      txPerMonth: intake.txPerMonth,
      avgPerTxUsd: intake.avgPerTxUsd.toString(),
      rangeMinUsd: intake.rangeMinUsd?.toString() || null,
      rangeMaxUsd: intake.rangeMaxUsd?.toString() || null,
      monthlyTotalUsd: intake.monthlyTotalUsd.toString(),
      serviceDescription: intake.serviceDescription,
      clientsType: intake.clientsType,
      clientsCountries: intake.clientsCountries,
      acceptsChargebackLiability: intake.acceptsChargebackLiability,
      acceptsAllowedUse: intake.acceptsAllowedUse,
      acceptsDataProcessing: intake.acceptsDataProcessing,
      ipCountry: intake.ipCountry,
      ipCity: intake.ipCity,
      ipRegion: intake.ipRegion,
      createdAt: intake.createdAt,
      updatedAt: intake.updatedAt,
    },
  });
}