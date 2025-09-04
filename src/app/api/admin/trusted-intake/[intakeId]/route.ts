import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const ADMIN_ID = process.env.ADMIN_CLERK_ID;

export async function PATCH(req: Request, { params }: { params: { intakeId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId || (ADMIN_ID && clerkId !== ADMIN_ID)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { decision, limits, notes } = body as {
    decision: "APPROVED" | "REJECTED";
    limits?: { maxPerTxUsd?: number|string; maxMonthlyUsd?: number|string; holdHours?: number };
    notes?: string;
  };
  if (!decision) return NextResponse.json({ error: "Missing decision" }, { status: 400 });

  const intake = await prisma.trustedIntake.findUnique({ where: { id: params.intakeId } });
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trustedIntake.update({
    where: { id: intake.id },
    data: {
      status: decision,
      reviewerId: clerkId,
      decisionAt: new Date(),
      audits: { create: { userId: intake.userId, action: decision, details: { notes } } }
    }
  });

  let profile = null;
  if (decision === "APPROVED") {
    profile = await prisma.trustedProfile.upsert({
      where: { userId: intake.userId },
      update: {
        enabled: true, status: "APPROVED",
        maxPerTxUsd: limits?.maxPerTxUsd != null ? new Prisma.Decimal(String(limits.maxPerTxUsd)) : undefined,
        maxMonthlyUsd: limits?.maxMonthlyUsd != null ? new Prisma.Decimal(String(limits.maxMonthlyUsd)) : undefined,
        holdHours: limits?.holdHours ?? undefined,
        notes: notes ?? undefined, reviewerId: clerkId,
      },
      create: {
        userId: intake.userId, enabled: true, status: "APPROVED",
        maxPerTxUsd: new Prisma.Decimal(String(limits?.maxPerTxUsd ?? 200)),
        maxMonthlyUsd: new Prisma.Decimal(String(limits?.maxMonthlyUsd ?? 1000)),
        holdHours: limits?.holdHours ?? 48,
        notes: notes ?? null, reviewerId: clerkId,
      }
    });
  }
  return NextResponse.json({ ok: true, profile });
}
