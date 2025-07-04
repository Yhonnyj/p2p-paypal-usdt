"use client";

import { Zap, Loader2, CheckCircle, Clock, XCircle, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Pusher from "pusher-js";

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
};

const statusColors = {
  PENDING: "text-yellow-400",
  COMPLETED: "text-green-400",
  CANCELLED: "text-red-400",
};

const statusIcons = {
  PENDING: <Clock className="w-5 h-5 animate-pulse" />,
  COMPLETED: <CheckCircle className="w-5 h-5" />,
  CANCELLED: <XCircle className="w-5 h-5" />,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const fetchOrders = async (status?: OrderStatus | "ALL") => {
    setLoading(true);
    try {
      const url = status && status !== "ALL" ? `/api/orders?status=${status}` : `/api/orders`;
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
          order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
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

  const handleOpenChatModal = (order: Order) => {
    setChatOrderId(order.id);
    setSelectedOrderDetails(order);
  };

  return (
    <div className="flex-1 text-white p-8 font-inter overflow-y-auto">
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center justify-center gap-3 drop-shadow-lg animate-fade-in-up">
          <Zap className="text-yellow-400 animate-pulse drop-shadow-md" size={36} /> Historial de Órdenes
        </h1>

        {/* Filtro por estado */}
        <div className="mb-6 text-center">
          <label className="text-sm text-gray-400 mr-2 font-semibold">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "ALL")}
            className="bg-gray-800 border border-gray-600 text-white rounded-md px-4 py-2"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-xl animate-fade-in">
            <Loader2 className="animate-spin w-10 h-10 text-green-400 mr-3" />
            <span className="text-xl text-gray-300">Cargando órdenes...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-300 text-lg mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-lg animate-fade-in">
            <p className="mb-4">No hay órdenes registradas en este estado.</p>
            <p className="text-sm text-gray-400">¡Comienza una nueva transacción hoy mismo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order.id}
                onClick={() => handleOpenChatModal(order)}
                className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl transition-all duration-300 hover:shadow-green-500/20 cursor-pointer transform hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700/50">
                  <span className="text-sm text-gray-400 font-medium">
                    {new Date(order.createdAt).toLocaleString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span
                    className={`flex items-center gap-2 text-base font-semibold px-3 py-1 rounded-full ${statusColors[order.status]} bg-gray-700/50`}
                  >
                    {statusIcons[order.status]} {order.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Plataforma</span>
                    <span className="font-medium text-white text-base">{order.platform}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Destino</span>
                    <span className="font-medium text-white text-base">{order.to}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Monto enviado</span>
                    <span className="font-medium text-white text-base">{order.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">USDT Recibido</span>
                    <span className="font-bold text-emerald-400 text-base">
                      {order.finalUsdt.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
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
            ))}
          </div>
        )}
      </div>

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
