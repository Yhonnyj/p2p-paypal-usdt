import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not synced" }, { status: 404 });

  const profile = await prisma.trustedProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    ok: true,
    profile: profile ? {
      enabled: profile.enabled,
      status: profile.status,
      maxPerTxUsd: profile.maxPerTxUsd.toString(),
      maxMonthlyUsd: profile.maxMonthlyUsd.toString(),
      holdHours: profile.holdHours,
      notes: profile.notes ?? null,
      updatedAt: profile.updatedAt
    } : null
  });
}
