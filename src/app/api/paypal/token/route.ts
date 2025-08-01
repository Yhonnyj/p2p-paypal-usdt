// app/api/paypal/token/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  try {
    const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al obtener token:", data);
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ accessToken: data.access_token });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
