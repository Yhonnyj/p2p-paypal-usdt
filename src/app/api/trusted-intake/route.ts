import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not synced" }, { status: 404 });

  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  const b = await req.json();
  const required = [
    "firstName","lastName","email","username","occupation","country",
    "txPerMonth","avgPerTxUsd","monthlyTotalUsd","serviceDescription","contributorType"
  ];
  for (const k of required) {
    if (!b?.[k]) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
  }
  if (!b.acceptsChargebackLiability || !b.acceptsAllowedUse || !b.acceptsDataProcessing) {
    return NextResponse.json({ error: "You must accept all declarations" }, { status: 400 });
  }

  const created = await prisma.trustedIntake.create({
    data: {
      userId: user.id,
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email,
      username: b.username,
      phone: b.phone || null,
      occupation: b.occupation,
      contributorType: b.contributorType, // "COMPANY" | "FREELANCER"
      companyName: b.companyName || null,
      website: b.website || null,
      country: b.country,
      txPerMonth: Number(b.txPerMonth),
      avgPerTxUsd: new Prisma.Decimal(String(b.avgPerTxUsd)),
      rangeMinUsd: b.rangeMinUsd != null ? new Prisma.Decimal(String(b.rangeMinUsd)) : null,
      rangeMaxUsd: b.rangeMaxUsd != null ? new Prisma.Decimal(String(b.rangeMaxUsd)) : null,
      monthlyTotalUsd: new Prisma.Decimal(String(b.monthlyTotalUsd)),
      serviceDescription: b.serviceDescription,
      clientsType: b.clientsType ?? null, // "PERSONS" | "COMPANIES" | "MIXED"
      clientsCountries: b.clientsCountries || null,
      acceptsChargebackLiability: !!b.acceptsChargebackLiability,
      acceptsAllowedUse: !!b.acceptsAllowedUse,
      acceptsDataProcessing: !!b.acceptsDataProcessing,
      ip, userAgent,
      audits: { create: { userId: user.id, action: "INTAKE_SUBMITTED", details: b } }
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
