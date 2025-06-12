"use client";

import { Zap, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
// Eliminado: import dynamic from "next/dynamic"; // No es necesario si se importa directamente o para Canvas

// TEMPORARY: Placeholder for OrderChatModal for Canvas compilation.
// In your actual Next.js project, you should import your real OrderChatModal component:
// import OrderChatModal from "@/components/OrderChatModal";
// If your OrderChatModal uses server-side features or needs dynamic loading,
// you might re-introduce dynamic import like this (but manage it in your own project):
// const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), { ssr: false });

// Placeholder component for Canvas environment
const OrderChatModal = ({ orderId, isOpen, onClose }: { orderId: string; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-3xl h-[90vh] md:h-auto overflow-y-auto transform scale-95 opacity-0 animate-scale-up-fade-in relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors duration-200 z-10"
          aria-label="Cerrar chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div className="flex-grow overflow-y-auto p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Chat de Orden #{orderId.substring(0, 8)}</h2>
          <p className="text-gray-300">Este es un placeholder del modal de chat. En tu aplicación real, aquí iría la funcionalidad de chat.</p>
          <p className="text-gray-500 text-sm mt-4">Cierra este modal para volver al historial de órdenes.</p>
        </div>
      </div>
    </div>
  );
};


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

        console.log("🟡 STATUS:", res.status);
        console.log("🟡 RESPONSE:", data);

        if (res.ok && active) {
          setOrders(data);
        } else {
          console.error("🔴 Error del backend:", data);
        }
      } catch (error) {
        console.error("🔴 Error cargando órdenes:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrders(); // primera carga
    const intervalId = setInterval(fetchOrders, 3000); // refresca cada 3 segundos

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    // The main container for the content area.
    // Removed min-h-screen and the absolute background div.
    // The background gradient is applied directly to this div.
    // Assumes this component is rendered within a parent dashboard layout that defines its height.
    <div className="flex-1 text-white p-8 font-inter overflow-y-auto"> {/* Removed bg-gradient-to-br */}
      {/* Removed the background styling directly to the parent div */}
      {/* No absolute inset-0 background div here, as it should be in the layout component if needed */}

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header with premium styling */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center gap-3 drop-shadow-lg animate-fade-in-up">
          <Zap className="text-yellow-400 animate-pulse drop-shadow-md" size={36} /> Historial de Órdenes
        </h1>

        {loading ? (
          <div className="flex justify-center items-center mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-xl animate-fade-in">
            <Loader2 className="animate-spin w-10 h-10 text-green-400 mr-3" />
            <span className="text-xl text-gray-300">Cargando órdenes...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-300 text-lg mt-20 p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-700 shadow-lg animate-fade-in">
            <p className="mb-4">Aún no tienes órdenes registradas.</p>
            <p className="text-sm text-gray-400">¡Comienza una nueva transacción hoy mismo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order.id}
                onClick={() => setChatOrderId(order.id)}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl transition-all duration-300 hover:shadow-green-500/20 cursor-pointer transform hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }} // Staggered animation
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700/50">
                  <span className="text-sm text-gray-400 font-medium">
                    {new Date(order.createdAt).toLocaleString("es-ES", {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
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
                  <div className="sm:col-span-2 md:col-span-1"> {/* Adjusted span for layout */}
                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">USDT Recibido</span>
                    <span className="font-bold text-green-400 text-base">
                      {order.finalUsdt.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Chat Modal (Premium Styling) - now uses the local placeholder component */}
      {chatOrderId && (
        <OrderChatModal
          orderId={chatOrderId}
          isOpen={!!chatOrderId}
          onClose={() => setChatOrderId(null)}
        />
      )}

      {/* Tailwind Custom Keyframe Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up-fade-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-up-fade-in { animation: scale-up-fade-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
        .font-inter { font-family: 'Inter', sans-serif; } /* Ensure Inter font is used */
      `}</style>
    </div>
  );
}
