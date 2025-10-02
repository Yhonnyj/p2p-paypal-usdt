// app/api/orders/route.ts
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { resend } from "@/lib/resend";

type Side = "BUY" | "SELL";
type Milestone = "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null;

interface RecipientDetails {
  type: "USDT" | "FIAT";
  currency: string;
  wallet?: string;
  network?: string;
  bankName?: string;
  phoneNumber?: string;
  idNumber?: string;
  accountNumber?: string;
  accountHolder?: string;
}

interface OrderRequestBody {
  platform: string;            // (legacy UI)
  side: Side;                  // BUY | SELL
  channelKey: string;          // "PAYPAL", "ZELLE", ...
  destinationCurrency: string; // "USDT" | "BS" | "COP" | "USD" | ...
  amount: number;              // USD
  paypalEmail?: string;        // requerido SOLO si canal = PAYPAL
  recipientDetails: RecipientDetails;
}

function milestoneDiscount(nthOrder: number): { percent: number; milestone: Milestone } {
  if (nthOrder === 1) return { percent: 50, milestone: "FIRST" };
  if (nthOrder === 5) return { percent: 18, milestone: "FIFTH" };
  if (nthOrder >= 15) return { percent: 10, milestone: "FIFTEEN_PLUS" };
  return { percent: 0, milestone: null };
}

// ============== POST /api/orders ==============
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body: OrderRequestBody = await req.json();
    const {
      platform,
      side,
      channelKey,
      destinationCurrency,
      amount,
      paypalEmail,
      recipientDetails,
    } = body;

    // -------- Validaciones --------
    if (!platform) return NextResponse.json({ error: "Falta 'platform'" }, { status: 400 });

    const sideU = String(side || "").toUpperCase() as Side;
    if (!["BUY", "SELL"].includes(sideU)) {
      return NextResponse.json({ error: "Side inválido" }, { status: 400 });
    }

    const channelKeyU = String(channelKey || "").toUpperCase().trim();
    if (!channelKeyU) return NextResponse.json({ error: "Falta 'channelKey'" }, { status: 400 });

    const destCurrencyU = String(destinationCurrency || "").toUpperCase().trim();
    if (!destCurrencyU) return NextResponse.json({ error: "Falta 'destinationCurrency'" }, { status: 400 });

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    if (!recipientDetails?.type || !recipientDetails.currency) {
      return NextResponse.json({ error: "Datos de destino incompletos" }, { status: 400 });
    }

    // -------- Usuario --------
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // -------- Canal (con ID y providerFeePercent) --------
    const channel = await prisma.paymentChannel.findUnique({
      where: { key: channelKeyU },
      select: {
        id: true,
        key: true,
        label: true,
        commissionBuyPercent: true,
        commissionSellPercent: true,
        providerFeePercent: true,
        enabledBuy: true,
        enabledSell: true,
        visible: true,
        archivedAt: true,
        statusTextBuy: true,
        statusTextSell: true,
      },
    });

    if (!channel || channel.archivedAt) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    const channelEnabled = sideU === "BUY" ? channel.enabledBuy : channel.enabledSell;
    if (!channel.visible || !channelEnabled) {
      const statusText = sideU === "BUY" ? channel.statusTextBuy : channel.statusTextSell;
      return NextResponse.json({ error: statusText || "Método no disponible" }, { status: 400 });
    }

    // PayPal: exigir email solo si el canal es PAYPAL
    if (channel.key === "PAYPAL" && !paypalEmail) {
      return NextResponse.json({ error: "Falta 'paypalEmail' para PayPal" }, { status: 400 });
    }

    // -------- Armar destino (to / wallet) --------
    const orderDetails: { to: string; wallet: string | null; paypalEmail: string | null } = {
      to: "",
      wallet: null,
      paypalEmail: paypalEmail ?? null,
    };

    if (recipientDetails.type === "USDT") {
      if (!recipientDetails.wallet || !recipientDetails.network) {
        return NextResponse.json({ error: "Datos de USDT incompletos" }, { status: 400 });
      }
      orderDetails.to = `USDT - ${recipientDetails.network}`;
      orderDetails.wallet = recipientDetails.wallet;
    } else {
      // FIAT
      if (!recipientDetails.bankName) {
        return NextResponse.json({ error: "Falta nombre del banco" }, { status: 400 });
      }
      orderDetails.to = recipientDetails.currency;

      const fiatData: {
        bankName: string;
        phoneNumber?: string;
        idNumber?: string;
        accountNumber?: string;
        accountHolder?: string;
      } = { bankName: recipientDetails.bankName };

      if (recipientDetails.currency === "BS") {
        if (!recipientDetails.phoneNumber || !recipientDetails.idNumber) {
          return NextResponse.json({ error: "Faltan datos para BS (teléfono y cédula)" }, { status: 400 });
        }
        fiatData.phoneNumber = recipientDetails.phoneNumber;
        fiatData.idNumber = recipientDetails.idNumber;
      }

      if (recipientDetails.currency === "COP") {
        if (!recipientDetails.accountNumber || !recipientDetails.accountHolder) {
          return NextResponse.json({ error: "Faltan datos para COP (número y titular)" }, { status: 400 });
        }
        fiatData.accountNumber = recipientDetails.accountNumber;
        fiatData.accountHolder = recipientDetails.accountHolder;
      }

      orderDetails.wallet = JSON.stringify(fiatData);
    }

    // -------- % del canal (SIN AppConfig) --------
    const commissionPercent =
      sideU === "BUY" ? channel.commissionBuyPercent : channel.commissionSellPercent;

   // -------- Descuento fidelidad: SOLO BUY --------
let userDiscountPercent = 0;

if (sideU === "BUY") {
  const completedCount = await prisma.order.count({
    where: { userId: dbUser.id, status: "COMPLETED" },
  });
  const nthOrder = completedCount + 1;
  const rule = milestoneDiscount(nthOrder);
  userDiscountPercent = rule.percent;
}


    // % final aplicado al cliente (ya con descuento)
    const appliedCommissionPct = commissionPercent * (1 - userDiscountPercent / 100);

    // -------- Tasa (buy/sell con fallback a rate). USD/USDT = 1 --------
    let exchangeRateUsed = 1;
    if (destCurrencyU !== "USDT" && destCurrencyU !== "USD") {
      const fx = await prisma.exchangeRate.findUnique({
        where: { currency: destCurrencyU },
        select: { rate: true, buyRate: true, sellRate: true },
      });
      if (!fx) return NextResponse.json({ error: `No hay tasa para ${destCurrencyU}` }, { status: 400 });

      const sideRate = sideU === "BUY" ? fx.buyRate : fx.sellRate;
      const picked = Number(sideRate ?? fx.rate);
      if (!Number.isFinite(picked) || picked <= 0) {
        return NextResponse.json({ error: `Tasa inválida para ${destCurrencyU}` }, { status: 400 });
      }
      exchangeRateUsed = picked;
    }

    // -------- Montos (USD) --------
    const appliedFixedFee = 0; // si algún canal tiene fee fijo, cámbialo aquí según channel.key
    const finalCommissionUsd = +(amount * appliedCommissionPct / 100).toFixed(2);
    const providerCostUsd = +(((channel.providerFeePercent ?? 0) * amount) / 100).toFixed(2);
    const profitUsd = +(finalCommissionUsd - appliedFixedFee - providerCostUsd).toFixed(2);

    const netUsd = +(amount - finalCommissionUsd).toFixed(2); // lo que recibe el cliente en USD antes de tasa
    const finalUsd = netUsd;
    const finalUsdt = destCurrencyU === "USDT" ? netUsd : 0;

    // -------- Crear orden --------
    const order = await prisma.order.create({
      data: {
        user: { connect: { id: dbUser.id } },
        platform, // legacy
        side: sideU,
        paymentChannel: { connect: { id: channel.id } }, // FK real
        paymentChannelKey: channel.key,                   // snapshot compat (opcional)
        amount,
        paypalEmail: orderDetails.paypalEmail,
        status: "PENDING",
        to: orderDetails.to,
        wallet: orderDetails.wallet,

        // Snapshots y resultados
        appliedCommissionPct,              // % aplicado al cliente
        appliedFixedFee,                   // fee fijo snapshot
        exchangeRateUsed,                  // 1 si USDT/USD o tasa fiat
        finalCommission: finalCommissionUsd, // comisión cobrada (USD)
        finalUsd,                          // USD neto
        finalUsdt,                         // USDT neto (si corresponde)
        profit: profitUsd,                 // ganancia estimada (USD)
      },
      include: { user: true, paymentChannel: { select: { key: true } } },
    });

    // -------- Factura PayPal (si corresponde) --------
    const origin = new URL(req.url).origin;
    if (order.paymentChannel?.key === "PAYPAL" && order.paypalEmail) {
      try {
        const paypalRes = await fetch(`${origin}/api/paypal/invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: order.paypalEmail, amount: order.amount }),
          cache: "no-store",
        });
        const paypalData = await paypalRes.json().catch(() => ({} as { invoiceId?: string }));
        if (paypalRes.ok && paypalData?.invoiceId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paypalInvoiceId: paypalData.invoiceId },
          });
        }
      } catch (e) {
        console.warn("No se pudo crear factura PayPal:", e);
      }
    }

    // -------- Mensaje automático en el chat --------
    await prisma.message.create({
      data: {
        content:
          "Gracias por preferir nuestra plataforma, tu orden está siendo procesada y la factura ha sido enviada a tu cuenta paypal.",
        senderId: "cmclws6rl0000vh38t04argqp", // bot / soporte automático
        orderId: order.id,
      },
    });

    await pusherServer.trigger(`order-${order.id}`, "new-message", {
      id: "auto-" + Date.now(),
      content:
        "Gracias por preferir nuestra plataforma, tu orden está siendo procesada.",
      createdAt: new Date().toISOString(),
      imageUrl: null,
      sender: {
        id: "cmclws6rl0000vh38t04argqp",
        fullName: "Soporte Automático",
        email: "bot@tucapi.com",
      },
      senderId: "cmclws6rl0000vh38t04argqp",
      orderId: order.id,
    });

    await pusherServer.trigger("orders-channel", "order-created", order);

  // -------- Notificación email (opcional) --------
try {
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Nueva Orden P2P en TuCapi <notificaciones@tucapi.app>",
      to: ["info@caibo.ca", "alejandro@tucapi.app"], // ✅ array de correos
      subject: `🟢 Tienes una nueva orden de ${order.user.fullName || order.user.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dgiy5onqs/image/upload/v1752778216/icon-512x512_vgkmra.png" alt="TuCapi Logo" style="height: 60px;" />
          </div>
          <h2 style="color: #10b981; text-align: center;">¡Nueva orden recibida! 🔔</h2>
          <p style="font-size: 16px; text-align: center;">
            Se ha generado una <strong>nueva orden P2P</strong> en TuCapi. A continuación, los detalles:
          </p>
          <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #ddd;">
            <p style="font-size: 16px; margin: 4px 0;"><strong>Cliente:</strong> ${order.user.fullName || order.user.email}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Plataforma:</strong> ${order.platform}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Monto:</strong> $${order.amount.toFixed(2)}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Destino:</strong> ${order.to}</p>
            <p style="font-size: 16px; margin: 4px 0;"><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-ES")}</p>
          </div>
          <p style="font-size: 16px; text-align: center;">Ingresa al panel de administración para gestionar la orden lo antes posible.</p>
          <p style="font-size: 16px; text-align: center;"><strong>Equipo TuCapi 💬</strong></p>
        </div>
      `,
    });
  }
} catch (e) {
  console.warn("No se pudo enviar email con Resend:", e);
}


    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ============== GET /api/orders ==============
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "PENDING" | "COMPLETED" | "CANCELLED" | null;

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error cargando órdenes:", error);
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
