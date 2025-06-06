import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { status, country } = await req.json();

  try {
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      const updated = await prisma.userProfile.update({
        where: { userId },
        data: {
          status,
          country,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    const created = await prisma.userProfile.create({
      data: {
        userId,
        status,
        country,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[USER_PROFILE_POST]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
