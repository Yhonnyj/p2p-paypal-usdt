// src/app/api/orders/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Definición de tipos para el cuerpo de la solicitud (para mayor claridad)
interface RecipientDetails {
  type: "USDT" | "FIAT";
  currency: string; // Ej: "USDT", "BS", "ARS"
  wallet?: string;
  network?: string; // Ej: "TRC20", "BEP20"
  bankName?: string; // Solo bankName, sin bankAccount
  phoneNumber?: string; // Solo para BS
  idNumber?: string; // Solo para BS
}

interface OrderRequestBody {
  platform: string;
  amount: number; // Monto en USD
  paypalEmail: string;
  recipientDetails: RecipientDetails; // El objeto estructurado que viene del frontend
}

// POST: Crear nueva orden
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body: OrderRequestBody = await req.json();
    const {
      platform,
      amount,
      paypalEmail,
      recipientDetails, // Ahora esperamos este objeto estructurado
    } = body;

    // --- Validación inicial de campos básicos ---
    if (!platform || !amount || !paypalEmail || !recipientDetails || !recipientDetails.type || !recipientDetails.currency) {
      return NextResponse.json({ error: "Datos básicos del pedido incompletos" }, { status: 400 });
    }

    // --- Validación y preparación de datos específicos según el tipo de destino ---
    let orderDetailsForDb: { to: string; wallet: string | null } = {
        to: "",
        wallet: null,
    };

    if (recipientDetails.type === "USDT") {
      if (!recipientDetails.wallet || !recipientDetails.network) {
        return NextResponse.json({ error: "Datos de USDT incompletos (wallet o red)" }, { status: 400 });
      }
      orderDetailsForDb.to = `USDT - ${recipientDetails.network}`;
      orderDetailsForDb.wallet = recipientDetails.wallet;
    } else if (recipientDetails.type === "FIAT") {
      if (!recipientDetails.bankName) {
        return NextResponse.json({ error: "Datos bancarios incompletos (nombre del banco)" }, { status: 400 });
      }
      orderDetailsForDb.to = recipientDetails.currency;
      orderDetailsForDb.wallet = null; // Wallet es nulo para transacciones FIAT

      let fiatDetails: { bankName: string; phoneNumber?: string; idNumber?: string } = {
          bankName: recipientDetails.bankName,
      };
      if (recipientDetails.currency === "BS") {
        if (!recipientDetails.phoneNumber || !recipientDetails.idNumber) {
          return NextResponse.json({ error: "Datos de BS incompletos (teléfono o cédula)" }, { status: 400 });
        }
        fiatDetails.phoneNumber = recipientDetails.phoneNumber;
        fiatDetails.idNumber = recipientDetails.idNumber;
      }
      orderDetailsForDb.wallet = JSON.stringify(fiatDetails); // Guarda como JSON string en el campo 'wallet'
    } else {
      return NextResponse.json({ error: "Tipo de destino desconocido" }, { status: 400 });
    }

    // --- Buscar usuario interno y configuración ---
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado en base de datos" }, { status: 404 });
    }

    const config = await prisma.appConfig.findUnique({ where: { id: 1 } });

    if (!config) {
      return NextResponse.json({ error: "Configuración no encontrada" }, { status: 500 });
    }

    const { rate, feePercent } = config;

    const finalUsd = amount * (1 - feePercent / 100);
    let finalUsdt = 0;

    // FIX: Asegurar que 'rate' sea un número válido y distinto de cero para el cálculo de finalUsdt
    if (recipientDetails.type === "USDT") {
      // Usar la tasa de USD de la configuración para la conversión a USDT.
      // Si la tasa es 0 o nula, usar 1 como fallback para evitar división por cero.
      const usdRateForUsdtConversion = (config.rate !== null && config.rate !== 0) ? config.rate : 1;
      finalUsdt = finalUsd / usdRateForUsdtConversion;
    }

    // --- Crear la orden en la base de datos ---
    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            id: dbUser.id
          }
        },
        platform,
        amount,
        finalUsd,
        finalUsdt,
        paypalEmail,
        status: "PENDING",
        to: orderDetailsForDb.to,
        wallet: orderDetailsForDb.wallet,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    if (error instanceof Error && error.name === 'PrismaClientValidationError') {
        return NextResponse.json({ error: "Error de validación de la base de datos. Por favor, revisa los datos enviados." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET: Listar órdenes del usuario autenticado (sin cambios aquí)
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado en base de datos" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error cargando órdenes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
