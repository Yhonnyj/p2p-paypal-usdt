// app/api/kyc/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.didit.me/verification-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "zvlZemIiVktXAhGNvNFc8k7c5vhB5RLyyH78AEzQF8E",
      },
      body: JSON.stringify({
        referenceId: userId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data); // <- contiene sessionId y URL de verificación
  } catch (_err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
