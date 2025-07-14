// app/api/user/orders/count/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const count = await prisma.order.count({
    where: { userId },
  });

  return NextResponse.json({ count });
}
