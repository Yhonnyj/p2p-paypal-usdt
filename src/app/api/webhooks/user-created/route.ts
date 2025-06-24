import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new NextResponse("Webhook secret no definido", { status: 500 });
  }

  const payload = await req.text();
  const svix_id = req.headers.get("svix-id") as string;
  const svix_timestamp = req.headers.get("svix-timestamp") as string;
  const svix_signature = req.headers.get("svix-signature") as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Faltan cabeceras de Svix", { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook no verificado", err);
    return new NextResponse("Webhook no verificado", { status: 400 });
  }

  const { id, email_addresses, first_name, last_name } = evt.data;

  try {
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        fullName: `${first_name || ""} ${last_name || ""}`.trim(),
      },
    });

    return new NextResponse("Usuario sincronizado con éxito", { status: 200 });
  } catch (err) {
    console.error("Error al crear usuario en base de datos", err);
    return new NextResponse("Error al sincronizar usuario", { status: 500 });
  }
}
