import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ADMIN_ID = "user_2y8MDKMBaoV4ar3YzC3oZIP9jxS"; // reemplaza con tu Clerk ID de admin

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const { userId } = await auth();

  if (userId !== ADMIN_ID) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = context.params;
  const { status } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const verification = await prisma.verification.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true, verification });
}
