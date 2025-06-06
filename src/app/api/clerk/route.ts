// src/app/api/clerk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs", // 👈 necesario para acceder a rawBody correctamente
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const signature = req.headers.get("svix-signature");

  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  const rawBody = await req.text();
  const isValid = verifySignature(rawBody, signature, WEBHOOK_SECRET);

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "user.created") {
    const { id, email_addresses } = event.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return NextResponse.json({ error: "Email no encontrado" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id },
      update: { email },
      create: { id, email },
    });

    return NextResponse.json({ message: "Usuario creado correctamente" }, { status: 200 });
  }

  return NextResponse.json({ message: "Evento no manejado" }, { status: 200 });
}

function verifySignature(payload: string, header: string, secret: string): boolean {
  try {
    const [t, s] = header.split(",").map(p => p.split("=")[1]);
    const base = `${t}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(base).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected));
  } catch {
    return false;
  }
}
