"use client";

import { Zap, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), {
  ssr: false,
});

type Order = {
  id: string;
  platform: string;
  to: string;
  amount: number;
  finalUsd: number;
  finalUsdt: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
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
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (res.ok && active) {
          setOrders(data);
        } else {
          console.error(data);
        }
      } catch (error) {
        console.error("Error cargando órdenes", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrders(); // primera carga

    const intervalId = setInterval(fetchOrders, 3000); // actualizar cada 3s

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-green-400 flex items-center justify-center gap-2">
          <Zap className="text-yellow-400 animate-pulse" /> Historial de Órdenes
        </h1>

        {loading ? (
          <div className="flex justify-center items-center mt-20">
            <Loader2 className="animate-spin w-8 h-8 text-white" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">Aún no tienes órdenes.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setChatOrderId(order.id)}
                className="border border-gray-800 rounded-2xl bg-gray-900/70 shadow-md px-6 py-4 backdrop-blur-md transition-all hover:shadow-lg cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleString("es-ES")}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-sm font-semibold ${statusColors[order.status]}`}
                  >
                    {statusIcons[order.status]} {order.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-400">Plataforma</span>
                    <span className="font-medium text-white">{order.platform}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Destino</span>
                    <span className="font-medium text-white">{order.to}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Monto enviado</span>
                    <span className="font-medium text-white">{order.amount.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">USDT Recibido</span>
                    <span className="font-bold text-green-400">
                      {order.finalUsdt.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatOrderId && (
        <OrderChatModal
          orderId={chatOrderId}
          isOpen={!!chatOrderId}
          onClose={() => setChatOrderId(null)}
        />
      )}
    </div>
  );
}
