import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_ID) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const skip = (page - 1) * limit;

    const where: Prisma.VerificationWhereInput =
      search.trim().length > 0
        ? {
            OR: [
              {
                user: {
                  is: { fullName: { contains: search, mode: "insensitive" } },
                },
              },
              {
                user: {
                  is: { email: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {};

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, fullName: true } },
        },
      }),
      prisma.verification.count({ where }),
    ]);

    return NextResponse.json({
      verifications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error en GET /admin/verifications:", error);
    return NextResponse.json(
      { error: "Error al obtener verificaciones" },
      { status: 500 }
    );
  }
}
