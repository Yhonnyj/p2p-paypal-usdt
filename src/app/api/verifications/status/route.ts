import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ status: "NONE" }, { status: 200 });
  }

  // Paso 1: Buscar el usuario en la base de datos
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    return NextResponse.json({ status: "NONE" }, { status: 200 });
  }

  // Paso 2: Buscar verificación relacionada
  const verification = await prisma.verification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ status: verification?.status || "NONE" });
}
