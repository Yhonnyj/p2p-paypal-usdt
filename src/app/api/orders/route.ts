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

// Contar órdenes previas reales (NO incluir la que está por crearse)
const ordersCount = await prisma.order.count({
  where: { userId: dbUser.id },
});

// Calcular multiplicador de descuento
let discountMultiplier = 1;

if (ordersCount === 0) {
  discountMultiplier = 0.5; // Primera orden = 50%
} else if (ordersCount === 4) {
  discountMultiplier = 0.82; // Quinta orden = 18%
} else if (ordersCount >= 14) {
  discountMultiplier = 0.90; // Desde la 15 en adelante = 10%
}


// Calcular comisión final
const finalCommission = feePercent * discountMultiplier;

// Aplicar la comisión
const finalUsd = amount * (1 - finalCommission / 100);
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
        finalCommission,
      },
      include: { user: true },
    });

// Enviar factura PayPal y guardar ID
const paypalRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/paypal/invoice`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: order.paypalEmail,
    amount: order.amount,
  }),
});

const paypalData = await paypalRes.json();
const paypalInvoiceId = paypalData.invoiceId;

// Actualizar la orden con el ID de la factura
if (paypalInvoiceId && typeof paypalInvoiceId === "string") {
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paypalInvoiceId, // o paypalInvoiceId: paypalInvoiceId
    },
  });
}

    // ✅ Mensaje automático del bot
    await prisma.message.create({
      data: {
        content: "Gracias por preferir nuestra plataforma, tu orden esta siendo procesada y la factura ha sido enviada a tu cuenta paypal. Si tienes alguna duda el operador estara encantado de ayudarte.",
        senderId: "cmclws6rl0000vh38t04argqp",
        orderId: order.id,
      },
    });

    await pusherServer.trigger(`order-${order.id}`, "new-message", {
      id: "auto-message-" + Date.now(),
      content: "Gracias por preferir nuestra plataforma, tu orden esta siendo procesada y la factura ha sido enviada a tu cuenta paypal. Si tienes alguna duda el operador estara encantado de ayudarte.",
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
  from: "Nueva Orden P2P en TuCapi <notificaciones@tucapi.app>",
  to: "info@caibo.ca",
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
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Cliente:</strong> ${order.user.fullName || order.user.email}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Plataforma:</strong> ${order.platform}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Monto:</strong> $${order.amount.toFixed(2)}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Destino:</strong> ${order.to}
        </p>
        <p style="font-size: 16px; margin: 4px 0;">
          <strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-ES")}
        </p>
      </div>

      <p style="font-size: 16px; text-align: center;">
        Ingresa al panel de administración para gestionar la orden lo antes posible.
      </p>

      <p style="font-size: 16px; text-align: center;">
        <strong>Equipo TuCapi 💬</strong>
      </p>
    </div>
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
