import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // Reemplaza por tu ID real de admin

export async function GET() {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const verifications = await prisma.verification.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  return NextResponse.json(verifications);
}
