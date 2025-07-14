// app/api/user/orders/count/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) return new NextResponse("Usuario no encontrado", { status: 404 });

  const count = await prisma.order.count({
    where: { userId: dbUser.id },
  });

  return NextResponse.json({ count });
}
