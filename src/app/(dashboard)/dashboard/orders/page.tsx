"use client";

import { OrderFormProvider, useOrderForm } from "@/context/OrderFormContext";
import {
  Zap,
  Loader2,
  CheckCircle,
  Clock,
  CircleX,
  MessageSquareText,
} from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Pusher from "pusher-js";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { bankOptions } from "@/lib/bankOptions";

const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), {
  ssr: false,
});

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

type Order = {
  id: string;
  platform: string;
  to: string;
  amount: number;
  finalUsd: number;
  finalUsdt: number;
  status: OrderStatus;
  createdAt: string;
  paypalEmail: string;
  wallet: string;
  user: {
    email: string;
    fullName: string;
  };
  bankName?: string;
};

const statusColors = {
  PENDING: "text-yellow-400",
  COMPLETED: "text-green-400",
  CANCELLED: "text-red-400",
};

const statusIcons = {
  PENDING: <Clock className="w-5 h-5 animate-pulse" />,
  COMPLETED: <CheckCircle className="w-5 h-5" />,
  CANCELLED: <CircleX className="w-5 h-5" />,
};

const platformLogos: Record<string, string> = {
  PayPal: "/images/paypal.png",
  Zelle: "/images/zelle.png",
  USDT: "/images/usdt.png",
};

const destinationLogos: Record<string, string> = {
  BINANCE_PAY: "/images/binance_pay.png",
  ARBITRUM: "/images/arbitrum.png",
  BEP20: "/images/bep20.png",
  TRC20: "/images/TRC20.png",
  BS: "/images/BS.png",
  COP: "/images/cop.png",
};

// --- Formatear fecha en estilo "24 julio 2025, 21:15" ---
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();
  const horas = date.getHours().toString().padStart(2, "0");
  const minutos = date.getMinutes().toString().padStart(2, "0");

  return `${dia} ${mes} ${año}, ${horas}:${minutos}`;
}

function OrdersContent() {
  const { exchangeRates } = useOrderForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(
    null
  );

  const fetchOrders = async (status?: OrderStatus | "ALL") => {
    setLoading(true);
    try {
      const url =
        status && status !== "ALL"
          ? `/api/orders?status=${status}`
          : `/api/orders`;
      const res = await fetch(url);
      const data: Order[] = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        console.error("❌ Error cargando órdenes:", data);
      }
    } catch (error) {
      console.error("❌ Error general:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const autoOpenChat = searchParams.get("chat") === "open";
  const autoOrderId = searchParams.get("id");

  useEffect(() => {
    fetchOrders();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("orders-channel");

    channel.bind("order-created", (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    channel.bind("order-updated", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id
            ? { ...order, status: updatedOrder.status }
            : order
        )
      );
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (autoOpenChat && autoOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === autoOrderId);
      if (order) {
        setChatOrderId(order.id);
        setSelectedOrderDetails(order);
      }
    }
  }, [autoOpenChat, autoOrderId, orders]);

  const handleOpenChatModal = (order: Order) => {
    setChatOrderId(order.id);
    setSelectedOrderDetails(order);
  };

  const summary = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <div className="flex-1 text-white p-8 font-inter overflow-y-auto">
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center justify-center gap-3 drop-shadow-lg animate-fade-in-up">
          <Zap className="text-yellow-400 animate-pulse drop-shadow-md" size={36} />
          Historial de Órdenes
        </h1>

        {/* Resumen */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm min-w-[100px]">
            <Clock className="text-yellow-400 w-4 h-4" />
            <span>{summary.PENDING} pendientes</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm min-w-[100px]">
            <CheckCircle className="text-green-400 w-4 h-4" />
            <span>{summary.COMPLETED} completadas</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm min-w-[100px]">
            <CircleX className="text-red-400 w-4 h-4" />
            <span>{summary.CANCELLED} canceladas</span>
          </div>
        </div>

        {/* Filtro */}
        <div className="mb-6 text-center">
          <label className="text-sm text-gray-400 mr-2 font-semibold">
            Filtrar por estado:
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | "ALL")
            }
            className="bg-gray-800 border border-gray-600 text-white rounded-md px-4 py-2"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center items-center mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-xl animate-fade-in">
            <Loader2 className="animate-spin w-10 h-10 text-green-400 mr-3" />
            <span className="text-xl text-gray-300">Cargando órdenes...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-300 text-lg mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-lg animate-fade-in">
            <p className="mb-4">No hay órdenes registradas en este estado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const [mainCurrency, destination] = order.to.includes("-")
                ? order.to.split("-").map((s) => s.trim())
                : [order.to, ""];

              let montoRecibido = order.finalUsd || 0;
              let currencyLabel = "USDT";

              if (order.to.includes("USDT")) {
                currencyLabel = "USDT";
              } else {
                const fiatRate =
                  exchangeRates.find((r) => r.currency === order.to)?.rate ?? 1;
                montoRecibido = order.finalUsd * fiatRate;
                currencyLabel = order.to;
              }

              // --- Mostrar logo de banco si destino es BS ---
              let bankLogo = null;
              if (destination === "BS" && order.bankName) {
                const bank = bankOptions.find(
                  (b) =>
                    b.value.toLowerCase() === order.bankName?.toLowerCase() ||
                    b.label.toLowerCase() === order.bankName?.toLowerCase()
                );
                bankLogo = bank?.img || destinationLogos.BS;
              }

              return (
                <div
                  key={order.id}
                  className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-green-500/20 cursor-pointer transform hover:scale-[1.01] transition"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Fecha y estado */}
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700/50">
                    <span className="text-sm text-gray-400 font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                    <span
                      className={`flex items-center gap-2 text-base font-semibold px-3 py-1 rounded-full ${statusColors[order.status]} bg-gray-700/50`}
                    >
                      {statusIcons[order.status]} {order.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">
                        Plataforma
                      </span>
                      <Image
                        src={platformLogos[order.platform] || "/images/default.png"}
                        alt={order.platform}
                        width={28}
                        height={28}
                        className="object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">
                        Destino
                      </span>
                      <div className="flex items-center gap-2">
                        {mainCurrency && (
                          <Image
                            src={platformLogos[mainCurrency] || "/images/BS.png"}
                            alt={mainCurrency}
                            width={28}
                            height={28}
                            className="object-contain rounded-full"
                          />
                        )}
                        <span>→</span>

                        {destination === "BS" ? (
                          <span className="flex items-center gap-2">
                            <Image
                              src={bankLogo || destinationLogos.BS}
                              alt={order.bankName || "BS"}
                              width={28}
                              height={28}
                              className="object-contain rounded-full"
                            />
                            <span className="text-sm text-gray-200">
                              {order.bankName || "Bolívares"}
                            </span>
                          </span>
                        ) : (
                          destination && (
                            <Image
                              src={
                                destinationLogos[destination] ||
                                "/images/default-dest.png"
                              }
                              alt={destination}
                              width={28}
                              height={28}
                              className="object-contain rounded-full"
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">
                        Monto Enviado
                      </span>
                      <span className="font-medium text-white text-base">
                        {order.amount.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">
                        {currencyLabel} RECIBIDOS
                      </span>
                      <span className="font-bold text-emerald-400 text-base">
                        {montoRecibido.toFixed(2)} {currencyLabel}
                      </span>
                    </div>
                  </div>

                  {/* Botón Chat */}
                  <div className="mt-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChatModal(order);
                      }}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 ml-auto"
                    >
                      Abrir Chat <MessageSquareText size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat */}
      {chatOrderId && selectedOrderDetails && (
        <OrderChatModal
          orderId={chatOrderId}
          isOpen={!!chatOrderId}
          onClose={() => {
            setChatOrderId(null);
            setSelectedOrderDetails(null);
          }}
          orderData={selectedOrderDetails}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <OrderFormProvider>
      <OrdersContent />
    </OrderFormProvider>
  );
}
