// app/api/admin/trusted-intake/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: Verificar que el usuario es admin
  // if (!isAdmin(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const intakes = await prisma.trustedIntake.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const processedIntakes = intakes.map((intake) => ({
      id: intake.id,
      userId: intake.userId,
      firstName: intake.firstName,
      lastName: intake.lastName,
      email: intake.email,
      username: intake.username,
      phone: intake.phone,
      
      occupation: intake.occupation,
      contributorType: intake.contributorType,
      companyName: intake.companyName,
      website: intake.website,
      country: intake.country,
      
      txPerMonth: intake.txPerMonth,
      avgPerTxUsd: intake.avgPerTxUsd.toString(),
      rangeMinUsd: intake.rangeMinUsd?.toString() || null,
      rangeMaxUsd: intake.rangeMaxUsd?.toString() || null,
      monthlyTotalUsd: intake.monthlyTotalUsd.toString(),
      
      serviceDescription: intake.serviceDescription,
      clientsType: intake.clientsType,
      clientsCountries: intake.clientsCountries,
      
      acceptsChargebackLiability: intake.acceptsChargebackLiability,
      acceptsAllowedUse: intake.acceptsAllowedUse,
      acceptsDataProcessing: intake.acceptsDataProcessing,
      
      status: intake.status,
      createdAt: intake.createdAt.toISOString(),
      ip: intake.ip,
      userAgent: intake.userAgent,
      
      // Usar los datos ya guardados en la base de datos
      ipCountry: intake.ipCountry,
      ipCity: intake.ipCity,
      ipRegion: intake.ipRegion,
      
      user: intake.user
    }));

    return NextResponse.json({ 
      ok: true, 
      rows: processedIntakes 
    });

  } catch (error) {
    console.error('Error fetching intakes:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}