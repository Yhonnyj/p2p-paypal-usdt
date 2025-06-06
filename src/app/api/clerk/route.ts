// app/api/clerk/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

const WEBHOOK_SECRET = "whsec_k1uFy53zGVxUJndTwjeMNyLVBguadZ1Q"; // ⚠️ Mantén esto en .env para producción

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("svix-signature");

    if (!signature) {
      return NextResponse.json({ error: "Sin firma" }, { status: 400 });
    }

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

      return NextResponse.json({ message: "Usuario creado" }, { status: 200 });
    }

    return NextResponse.json({ message: "Evento ignorado" }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook Clerk:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function verifySignature(payload: string, header: string, secret: string): boolean {
  try {
    const [timestampPart, signaturePart] = header.split(",").map(p => p.split("=")[1]);
    const signedPayload = `${timestampPart}.${payload}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
