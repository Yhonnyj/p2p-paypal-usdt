// app/api/admin/payment-channels/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type PaymentChannel } from "@prisma/client";
import { z } from "zod";

const ADMIN_CLERK_ID =
  process.env.APP_ENV === "production"
    ? process.env.ADMIN_CLERK_ID_PROD
    : process.env.ADMIN_CLERK_ID_STAGING;

const BodySchema = z.object({
  key: z.string().min(2),
  label: z.string().min(2),

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

type ApiError = { error: string; details?: unknown };

function isAdmin(userId?: string | null): boolean {
  if (!ADMIN_CLERK_ID) return false;
  return userId === ADMIN_CLERK_ID;
}

function cleanNullableText(v?: string | null): string | null {
  return typeof v === "string" ? v.trim() : null;
}

export async function GET() {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json<ApiError>({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const channels = await prisma.paymentChannel.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json<PaymentChannel[]>(channels);
  } catch (err: unknown) {
    console.error("Error obteniendo PaymentChannels:", err);
    return NextResponse.json<ApiError>({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return NextResponse.json<ApiError>({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // evitar any: tipamos lo que viene de req.json() como unknown y validamos con zod
    const json: unknown = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
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

    const normalizedKey = key.toUpperCase().trim();

    const exists = await prisma.paymentChannel.findUnique({
      where: { key: normalizedKey },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json<ApiError>(
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
        statusTextBuy: cleanNullableText(statusTextBuy),
        statusTextSell: cleanNullableText(statusTextSell),
        sortOrder,
      },
    });

    return NextResponse.json<PaymentChannel>(newChannel, { status: 201 });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json<ApiError>(
        { error: "Key ya existe (único)" },
        { status: 409 }
      );
    }
    console.error("Error creando PaymentChannel:", err);
    return NextResponse.json<ApiError>({ error: "Error del servidor" }, { status: 500 });
  }
}
