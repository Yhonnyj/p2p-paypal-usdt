import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ No autenticado");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

  // Buscar el usuario en la base de datos
const user = await prisma.user.findUnique({
  where: { clerkId: userId },
  include: {
    referralEarnings: {
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
  },
});

if (!user) {
  console.error("❌ Usuario no encontrado para clerkId:", userId);
  return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
}

    // Calcular total
    const totalGanado = user.referralEarnings.reduce((sum, e) => sum + e.amount, 0);

    // Debug log
    console.log("✅ Usuario encontrado:", user);

    return NextResponse.json({
      link: `https://tucapi.com?r=${user.id}`,
      totalGanado,
      earnings: user.referralEarnings,
    });
  } catch (error) {
    console.error("❌ Error en GET /api/referrals:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
