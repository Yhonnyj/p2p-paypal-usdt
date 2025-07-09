// app/api/clerk/route.ts

import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers"; // 👈 para leer cookie de referido

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

type ClerkEvent = {
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
  };
  type: "user.created";
};

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers) as ClerkEvent;

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(" ");

      if (!email) {
        return NextResponse.json({ error: "Email no encontrado" }, { status: 400 });
      }

     // Extraer manualmente la cookie del header
const cookieHeader = req.headers.get("cookie") || "";
const referrerId = cookieHeader
  .split(";")
  .find((c) => c.trim().startsWith("referrerId="))
  ?.split("=")[1];



      

      // ✅ Validar si ese referido realmente existe
      const validReferrer = referrerId
        ? await prisma.user.findUnique({ where: { id: referrerId } })
        : null;

      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          fullName,
...(validReferrer && { referrerId })
        },
        create: {
          clerkId: id,
          email,
          fullName,
...(validReferrer && { referrerId })
        },
      });

      return NextResponse.json({ message: "Usuario creado" }, { status: 200 });
    }

    return NextResponse.json({ message: "Evento ignorado" }, { status: 200 });
  } catch (err) {
    console.error("❌ Error procesando webhook Clerk:", err);
    return NextResponse.json({ error: "Webhook inválido o fallo interno" }, { status: 400 });
  }
}
