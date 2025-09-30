// app/api/paypal/invoice/route.ts
import { NextRequest, NextResponse } from "next/server";

type Account = "CAIBO" | "CLOUD";

// Regla: >=100 → Caibo ; <100 → Cloud
const THRESHOLD_USD = 100;

// Términos ES para ambas cuentas
const TERMS_ES =
  "El Cliente reconoce y acepta que no se admitirán reclamaciones ni reembolsos una vez que el servicio haya sido prestado y recibido. Cualquier intento de iniciar un reclamo después de la recepción del servicio podrá considerarse fraudulento y será notificado de inmediato a las autoridades competentes.";

export async function POST(req: NextRequest) {
  const { email, amount } = await req.json();

  if (!email || !amount) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  // 0) Elegir cuenta por monto
  const account: Account = amountNum < THRESHOLD_USD ? "CLOUD" : "CAIBO";
  const isCaibo = account === "CAIBO";

  // 1) Credenciales por cuenta (Caibo = las que ya tenías)
  const clientId = isCaibo
    ? process.env.PAYPAL_CLIENT_ID!
    : process.env.PAYPAL_CLOUD_CLIENT_ID!;
  const secret = isCaibo
    ? process.env.PAYPAL_CLIENT_SECRET!
    : process.env.PAYPAL_CLOUD_CLIENT_SECRET!;

  if (!clientId || !secret) {
    return NextResponse.json(
      { error: `Faltan credenciales para ${account}` },
      { status: 500 }
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  try {
    // 2) Access token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "Accept-Language": "en_US",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.json(
        { error: "No se pudo obtener access_token", details: errText, account_used: account },
        { status: 400 }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3) Crear la factura (branding y concepto por cuenta)
    const itemName = isCaibo ? "Servicio de marketing" : "Servicios administrativos";
    const note = itemName;

    const invoiceRes = await fetch("https://api-m.paypal.com/v2/invoicing/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        detail: {
          currency_code: "USD",
          note,
          terms_and_conditions: TERMS_ES,
          reference: account, // útil para conciliación
        },
        invoicer: {
          name: { given_name: isCaibo ? "Caibo INC" : "Cloud Connection LLC" },
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
            name: itemName,
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: amountNum.toFixed(2),
            },
          },
        ],
      }),
    });

    const invoice = await invoiceRes.json();

    if (!invoiceRes.ok) {
      return NextResponse.json(
        { error: "No se pudo crear la factura", details: invoice, account_used: account },
        { status: 400 }
      );
    }

    // PayPal v2 retorna id; mantenemos fallback a href por compatibilidad con tu versión previa
    const invoiceId: string | undefined = invoice.id || invoice.href?.split("/").pop();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "No se pudo obtener invoiceId", details: invoice, account_used: account },
        { status: 400 }
      );
    }

    // 4) Enviar la factura (evita que quede en Draft)
    const sendRes = await fetch(`https://api-m.paypal.com/v2/invoicing/invoices/${invoiceId}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!sendRes.ok) {
      const error = await sendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "No se pudo enviar la factura", details: error, account_used: account, invoiceId },
        { status: 400 }
      );
    }

    // 5) OK
    return NextResponse.json({ success: true, invoiceId, account_used: account });
  } catch (error: any) {
    console.error("❌ Error al crear/enviar factura:", error?.message || error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
