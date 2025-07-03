import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { expoPushToken } = await req.json();

  if (!expoPushToken) {
    return new NextResponse("Token no proporcionado", { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { clerkId: userId }, // 👈 Este es el correcto según tu schema
      data: { expoPushToken },
    });

    return NextResponse.json({ success: true });
  } catch {
  return new NextResponse("Error al guardar el token", { status: 500 });
}

}
