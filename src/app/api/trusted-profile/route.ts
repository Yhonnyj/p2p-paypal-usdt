import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync del usuario en DB
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

  const prof = await prisma.trustedProfile.findUnique({ where: { userId: user.id } });
  if (!prof) return NextResponse.json({ ok: true, profile: null });

  return NextResponse.json({
    ok: true,
    profile: {
      enabled: prof.enabled,
      status: prof.status,
      maxPerTxUsd: prof.maxPerTxUsd.toString(),
      maxMonthlyUsd: prof.maxMonthlyUsd.toString(),
      holdHours: prof.holdHours,
      notes: prof.notes ?? null,
      updatedAt: prof.updatedAt,
    },
  });
}