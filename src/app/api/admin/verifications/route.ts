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
    const search = (searchParams.get("search") || "").trim();
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "6", 10);

    // Validaciones
    if (page < 1) page = 1;
    if (limit < 1) limit = 6;
    if (limit > 50) limit = 50; // Evitar consultas enormes

    const skip = (page - 1) * limit;

    // Filtro de búsqueda
    const where: Prisma.VerificationWhereInput = search
      ? {
          OR: [
            { user: { is: { fullName: { contains: search, mode: "insensitive" } } } },
            { user: { is: { email: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {};

    // Consultas en paralelo
    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          documentUrl: true,
          selfieUrl: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.verification.count({ where }),
    ]);

    return new NextResponse(
      JSON.stringify({
        verifications,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=10, stale-while-revalidate=30", // Cache en Vercel Edge
        },
      }
    );
  } catch (error) {
    console.error("Error en GET /admin/verifications:", error);
    return NextResponse.json(
      { error: "Error al obtener verificaciones" },
      { status: 500 }
    );
  }
}
