// app/api/admin/payment-channels/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 🔐 Admin dinámico según entorno
const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

const BodySchema = z.object({
  key: z.string().min(2),
  label: z.string().min(2),
  // coerciones numéricas seguras: aceptan string o number
  commissionBuyPercent: z.coerce.number().min(0),
  commissionSellPercent: z.coerce.number().min(0),
  providerFeePercent: z.coerce.number().min(0).optional().default(0),

  enabledBuy: z.coerce.boolean().optional().default(true),
  enabledSell: z.coerce.boolean().optional().default(true),
  visible: z.coerce.boolean().optional().default(true),

  statusTextBuy: z.string().optional().nullable(),
  statusTextSell: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0),
});

function isAdmin(userId?: string | null) {
  if (!ADMIN_CLERK_ID) return false; // si no hay var de entorno, bloquear
  return userId === ADMIN_CLERK_ID;
}

export async function GET() {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const channels = await prisma.paymentChannel.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(channels);
  } catch (err) {
    console.error("Error obteniendo PaymentChannels:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      key,
      label,
      commissionBuyPercent,
      commissionSellPercent,
      providerFeePercent,
      enabledBuy,
      enabledSell,
      visible,
      statusTextBuy,
      statusTextSell,
      sortOrder,
    } = parsed.data;

    // normaliza key a MAYÚSCULAS
    const normalizedKey = key.toUpperCase().trim();

    // evita duplicados por key
    const exists = await prisma.paymentChannel.findUnique({
      where: { key: normalizedKey },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Ya existe un canal con ese key" },
        { status: 409 }
      );
    }

    const newChannel = await prisma.paymentChannel.create({
      data: {
        key: normalizedKey,
        label: label.trim(),
        commissionBuyPercent,
        commissionSellPercent,
        providerFeePercent: providerFeePercent ?? 0,
        enabledBuy,
        enabledSell,
        visible,
        statusTextBuy: statusTextBuy?.trim() || null,
        statusTextSell: statusTextSell?.trim() || null,
        sortOrder,
      },
    });

    return NextResponse.json(newChannel, { status: 201 });
  } catch (err: any) {
    // Manejo de error por constraint única (por si llega carrera)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Key ya existe (único)" },
        { status: 409 }
      );
    }
    console.error("Error creando PaymentChannel:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
