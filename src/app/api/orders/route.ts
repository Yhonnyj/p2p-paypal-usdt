export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { resend } from "@/lib/resend";

interface RecipientDetails {
  type: "USDT" | "FIAT";
  currency: string;
  wallet?: string;
  network?: string;
  bankName?: string;
  phoneNumber?: string;
  idNumber?: string;
}

interface OrderRequestBody {
  platform: string;
  amount: number;
  paypalEmail: string;
  recipientDetails: RecipientDetails;
}

// ✅ POST: Crear nueva orden
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body: OrderRequestBody = await req.json();
    const { platform, amount, paypalEmail, recipientDetails } = body;

    if (
      !platform || !amount || !paypalEmail ||
      !recipientDetails?.type || !recipientDetails.currency
    ) {
      return NextResponse.json({ error: "Datos básicos del pedido incompletos" }, { status: 400 });
    }

    const orderDetails: { to: string; wallet: string | null } = { to: "", wallet: null };

    if (recipientDetails.type === "USDT") {
      if (!recipientDetails.wallet || !recipientDetails.network) {
        return NextResponse.json({ error: "Datos de USDT incompletos (wallet o red)" }, { status: 400 });
      }
      orderDetails.to = `USDT - ${recipientDetails.network}`;
      orderDetails.wallet = recipientDetails.wallet;
    } else if (recipientDetails.type === "FIAT") {
      if (!recipientDetails.bankName) {
        return NextResponse.json({ error: "Falta nombre del banco" }, { status: 400 });
      }
      orderDetails.to = recipientDetails.currency;

      const fiatData: { bankName: string; phoneNumber?: string; idNumber?: string } = {
        bankName: recipientDetails.bankName,
      };

      if (recipientDetails.currency === "BS") {
        if (!recipientDetails.phoneNumber || !recipientDetails.idNumber) {
          return NextResponse.json({ error: "Faltan teléfono o cédula para BS" }, { status: 400 });
        }
        fiatData.phoneNumber = recipientDetails.phoneNumber;
        fiatData.idNumber = recipientDetails.idNumber;
      }

      orderDetails.wallet = JSON.stringify(fiatData);
    } else {
      return NextResponse.json({ error: "Tipo de destino desconocido" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
    if (!config) return NextResponse.json({ error: "Configuración no encontrada" }, { status: 500 });

    const { feePercent, rate } = config;
    const finalUsd = amount * (1 - feePercent / 100);
    const finalUsdt = recipientDetails.type === "USDT"
      ? finalUsd / ((rate && rate !== 0) ? rate : 1)
      : 0;

    const order = await prisma.order.create({
      data: {
        user: { connect: { id: dbUser.id } },
        platform,
        amount,
        finalUsd,
        finalUsdt,
        paypalEmail,
        status: "PENDING",
        to: orderDetails.to,
        wallet: orderDetails.wallet,
      },
      include: { user: true },
    });

    // ✅ Mensaje automático del bot
    await prisma.message.create({
      data: {
        content: "Gracias por preferir nuestra plataforma, tu orden será procesada en breve. Si tienes alguna duda un operador será asignado pronto.",
        senderId: "cmclws6rl0000vh38t04argqp",
        orderId: order.id,
      },
    });

    await pusherServer.trigger(`order-${order.id}`, "new-message", {
      id: "auto-message-" + Date.now(),
      content: "Gracias por preferir nuestra plataforma, tu orden será procesada en breve. Si tienes alguna duda un operador será asignado pronto.",
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

    await resend.emails.send({
      from: "Nueva Orden P2P en TuCapi <neworder@tucapi.com>",
      to: "info@caibo.ca",
      subject: `🟢 Tienes una nueva orden de ${order.user.fullName || order.user.email}`,
      html: `
        <h2>Nueva orden recibida</h2>
        <p><strong>Cliente:</strong> ${order.user.fullName || order.user.email}</p>
        <p><strong>Plataforma:</strong> ${order.platform}</p>
        <p><strong>Monto:</strong> $${order.amount.toFixed(2)}</p>
        <p><strong>Destino:</strong> ${order.to}</p>
        <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-ES")}</p>
      `,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ✅ GET: Listar órdenes del usuario autenticado, con filtro opcional por estado
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "PENDING" | "COMPLETED" | "CANCELLED" | null;

    const orders = await prisma.order.findMany({
      where: {
        userId: dbUser.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error cargando órdenes:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
