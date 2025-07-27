// app/api/clerk/route.ts
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    unsafe_metadata?: {
      referrerId?: string;
    };
  };
};

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers) as ClerkUserCreatedEvent;

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, unsafe_metadata } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(" ");

      console.log("📥 Clerk Webhook: Nuevo usuario creado:", id);
      console.log("Referrer ID recibido:", unsafe_metadata?.referrerId);

      if (!email) {
        return NextResponse.json({ error: "Email no encontrado" }, { status: 400 });
      }

      const referrerId = unsafe_metadata?.referrerId;
      const validReferrer = referrerId
        ? await prisma.user.findUnique({ where: { id: referrerId } })
        : null;

      if (referrerId && !validReferrer) {
        console.warn(`⚠️ El referrerId ${referrerId} no existe en la BD`);
      }

      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          fullName,
          ...(validReferrer && { referrerId: validReferrer.id }),
        },
        create: {
          clerkId: id,
          email,
          fullName,
          ...(validReferrer && { referrerId: validReferrer.id }),
        },
      });

      return NextResponse.json({ message: "Usuario creado con referidor" }, { status: 200 });
    }

    return NextResponse.json({ message: "Evento ignorado" }, { status: 200 });
  } catch (err) {
    console.error("❌ Error procesando webhook Clerk:", err);
    return NextResponse.json({ error: "Webhook inválido o fallo interno" }, { status: 400 });
  }
}
