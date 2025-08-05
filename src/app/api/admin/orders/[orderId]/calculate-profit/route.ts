import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (!order.paypalInvoiceId) {
      return NextResponse.json({ error: "Orden no tiene PayPal Invoice ID" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Buscar transacción en PayPal por invoice_id
    const txRes = await fetch(
      `https://api-m.paypal.com/v1/reporting/transactions?invoice_id=${order.paypalInvoiceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const txData = await txRes.json();

    const transaction = txData?.transaction_details?.[0]?.transaction_info;
    if (!transaction) {
      return NextResponse.json({ error: "No se encontró transacción para esta factura" }, { status: 404 });
    }

    const netAmountStr = transaction.net_amount?.value;
    const netAmount = netAmountStr ? parseFloat(netAmountStr) : null;

    if (netAmount === null) {
      return NextResponse.json({ error: "No se pudo obtener monto neto" }, { status: 400 });
    }

    // Calcular ganancia
    const realProfit = netAmount - (order.finalUsd || 0);

    // Guardar en la orden
    await prisma.order.update({
      where: { id: order.id },
      data: { realProfit },
    });

    return NextResponse.json({
      orderId: order.id,
      paypalInvoiceId: order.paypalInvoiceId,
      grossAmount: transaction.transaction_amount?.value,
      fee: transaction.fee_amount?.value,
      netAmount,
      finalUsd: order.finalUsd,
      realProfit,
      message: "Ganancia calculada y guardada correctamente",
    });
  } catch (error) {
    console.error("Error calculando ganancia:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
