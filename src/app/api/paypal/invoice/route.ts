import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, amount } = await req.json();

  if (!email || !amount) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  try {
    // 1. Obtener access token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Crear la factura
    const invoiceRes = await fetch("https://api-m.paypal.com/v2/invoicing/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        detail: {
          currency_code: "USD",
          note: "Servicio de marketing",
          terms_and_conditions: "Gracias por usar Caibo INC",
        },
        invoicer: {
          name: { given_name: "Caibo INC" },
        },
        primary_recipients: [
          {
            billing_info: {
              email_address: email,
            },
          },
        ],
        items: [
          {
            name: "Servicio de marketing",
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: amount.toString(),
            },
          },
        ],
      }),
    });

    const invoice = await invoiceRes.json();
    const invoiceId = invoice.href?.split("/").pop();

    if (!invoiceId) {
      console.error("💥 No se pudo obtener el ID de la factura:", invoice);
      return NextResponse.json({ error: "No se pudo obtener el ID de la factura", details: invoice }, { status: 400 });
    }

    // 3. Enviar la factura
    const sendRes = await fetch(`https://api-m.paypal.com/v2/invoicing/invoices/${invoiceId}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!sendRes.ok) {
      const error = await sendRes.json();
      console.error("💥 Error al enviar factura:", error);
      return NextResponse.json({ error: "No se pudo enviar factura", details: error }, { status: 400 });
    }

    // 4. Retornar éxito
    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    console.error("❌ Error al crear/enviar factura:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
