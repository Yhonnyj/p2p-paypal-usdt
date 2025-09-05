// app/api/admin/trusted-profile/[userId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const ADMIN_ID = process.env.ADMIN_CLERK_ID;

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId || (ADMIN_ID && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const p = await prisma.trustedProfile.findUnique({ where: { userId: params.userId } });
  if (!p) return NextResponse.json({ ok: true, profile: null });

  return NextResponse.json({
    ok: true,
    profile: {
      ...p,
      maxPerTxUsd: p.maxPerTxUsd.toString(),
      maxMonthlyUsd: p.maxMonthlyUsd.toString(),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId || (ADMIN_ID && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const { maxPerTxUsd, maxMonthlyUsd, holdHours, enabled, notes, status } = body as {
    maxPerTxUsd?: number | string;
    maxMonthlyUsd?: number | string;
    holdHours?: number;
    enabled?: boolean;
    notes?: string | null;
    status?: "PENDING" | "APPROVED" | "REJECTED";
  };

  const updated = await prisma.trustedProfile.upsert({
    where: { userId: params.userId },
    update: {
      maxPerTxUsd: maxPerTxUsd != null ? new Prisma.Decimal(String(maxPerTxUsd)) : undefined,
      maxMonthlyUsd: maxMonthlyUsd != null ? new Prisma.Decimal(String(maxMonthlyUsd)) : undefined,
      holdHours: holdHours ?? undefined,
      enabled: enabled ?? undefined,
      notes: notes ?? undefined,
      status: status ?? undefined,
      reviewerId: clerkId,
    },
    create: {
      userId: params.userId,
      enabled: enabled ?? true,
      status: status ?? "APPROVED",
      maxPerTxUsd: new Prisma.Decimal(String(maxPerTxUsd ?? 200)),
      maxMonthlyUsd: new Prisma.Decimal(String(maxMonthlyUsd ?? 1000)),
      holdHours: holdHours ?? 48,
      notes: notes ?? null,
      reviewerId: clerkId,
    },
  });

  // Crear audit log
  await prisma.trustedAudit.create({
    data: {
      userId: params.userId,
      action: "PROFILE_UPDATED",
      details: {
        maxPerTxUsd: maxPerTxUsd,
        maxMonthlyUsd: maxMonthlyUsd,
        holdHours: holdHours,
        notes: notes,
        enabled: enabled,
        status: status,
        updatedBy: clerkId,
      }
    }
  });

  return NextResponse.json({
    ok: true,
    profile: {
      ...updated,
      maxPerTxUsd: updated.maxPerTxUsd.toString(),
      maxMonthlyUsd: updated.maxMonthlyUsd.toString(),
    },
  });
}