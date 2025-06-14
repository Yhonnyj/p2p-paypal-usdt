"use client";

import { MessageSquareText, Loader2, CircleX, CheckCircle, Clock, XCircle  } from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from 'react-toastify';
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
  paypalEmail: string;
  wallet: string;
  status: OrderStatus;
  createdAt: string;
  user: {
    email: string;
    fullName: string;
  };
};

const PAGE_SIZE = 10;

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchInitialOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error cargando órdenes");
        }
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Error desconocido");
        toast.error(`Error: ${error.message || "No se pudieron cargar las órdenes."}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialOrders();
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("orders-channel");

    channel.bind("order-created", (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast.success(`🟢 Nueva orden de ${newOrder.user.fullName || newOrder.user.email}`);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.user.fullName?.toLowerCase().includes(term) ||
        order.user.email?.toLowerCase().includes(term) ||
        order.paypalEmail?.toLowerCase().includes(term) ||
        order.wallet?.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
    setPage(1);
  }, [search, orders]);

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error actualizando estado");
      }

      const updatedOrder: Order = await res.json();

      if (selectedOrderDetails && selectedOrderDetails.id === updatedOrder.id) {
        setSelectedOrderDetails(prev => ({ ...prev!, status: updatedOrder.status }));
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === updatedOrder.id ? { ...updatedOrder, user: o.user } : o
        )
      );
      toast.success(`Orden ${orderId.substring(0, 8)}... actualizada a ${newStatus}.`);
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar: ${error.message || "Inténtalo de nuevo."}`);
    }
  };

  const handleRowClick = (orderId: string) => {
    const orderToDisplay = orders.find(order => order.id === orderId);
    if (orderToDisplay) {
      setSelectedOrderDetails(orderToDisplay);
      setSelectedOrderId(orderId);
      setIsChatOpen(true);
    } else {
      toast.error("No se encontraron los detalles de la orden para mostrar en el chat.");
    }
  };

  const getStatusDisplay = (status: OrderStatus) => {
    let colorClass = "";
    let displayText = "";
    let icon = null;

    switch (status) {
      case "PENDING":
        colorClass = "bg-yellow-600/20 text-yellow-300";
        displayText = "Pendiente";
        icon = <Clock className="w-4 h-4" />;
        break;
      case "COMPLETED":
        colorClass = "bg-green-600/20 text-green-300";
        displayText = "Completada";
        icon = <CheckCircle className="w-4 h-4" />;
        break;
      case "CANCELLED":
        colorClass = "bg-red-600/20 text-red-300";
        displayText = "Cancelada";
        icon = <XCircle className="w-4 h-4" />;
        break;
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colorClass}`}>
        {icon} {displayText}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-gray-100 p-8 font-inter overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10" style={{
        background: 'radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg">
          Dashboard de Órdenes
        </h1>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar órdenes por nombre, email, PayPal o wallet..."
          className="mb-8 w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-lg"
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-lg">
            <Loader2 className="animate-spin mb-4" size={32} />
            Cargando órdenes...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 text-lg">
            <CircleX size={32} className="mb-4" /> {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center mt-10 text-gray-400 text-lg">No hay órdenes que coincidan con tu búsqueda.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl shadow-2xl border border-gray-800 bg-gray-900">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-300 bg-gray-800 uppercase tracking-wider text-left">
                    <th className="px-6 py-4 rounded-tl-2xl">ID</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">PayPal Email</th>
                    <th className="px-6 py-4">Destino</th>
                    <th className="px-6 py-4">Wallet/Detalles</th>
                    <th className="px-6 py-4 text-right">Monto USD</th>
                    <th className="px-6 py-4 text-right">Recibe USDT/FIAT</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)} // Llama a handleRowClick con el ID//
                      className={`hover:bg-gray-800/70 border-t border-gray-800 transition duration-150 ease-in-out cursor-pointer ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{order.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-200">{order.user?.fullName ?? "—"}</div>
                        <div className="text-gray-400 text-xs">{order.user?.email ?? "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{order.paypalEmail}</td>
                      <td className="px-6 py-4 text-gray-300">{order.platform} a {order.to}</td>
                      <td className="px-6 py-4 text-gray-300 break-words max-w-[150px]">{order.wallet || "N/A"}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-400">${order.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">
                        {order.finalUsdt ? `${order.finalUsdt.toFixed(2)} USDT` : `${order.finalUsd.toFixed(2)} ${order.to}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusDisplay(order.status)} {/* Usa el helper para el status badge */}
                          <select
                            value={order.status}
                            onClick={(e) => e.stopPropagation()} // Evita que el click en el select active handleRowClick
                            onChange={(e) =>
                              updateStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="bg-gray-700 text-white rounded-lg px-3 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors duration-200"
                          >
                            <option value="PENDING">Pendiente</option>
                            <option value="COMPLETED">Completada</option>
                            <option value="CANCELLED">Cancelada</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start justify-center text-xs text-gray-400">
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRowClick(order.id); }} // Asegura que el botón active el modal
                            className="mt-2 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-md transform active:scale-95"
                            title="Abrir Chat de Orden"
                          >
                            <MessageSquareText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-40 disabled:shadow-none transform active:scale-95"
              >
                Anterior
              </button>
              <span className="text-md text-gray-300 font-medium">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-40 disabled:shadow-none transform active:scale-95"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      {isChatOpen && selectedOrderId && (
        <OrderChatModal
          orderId={selectedOrderId}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedOrderId(null);
            setSelectedOrderDetails(null); // Limpiar los detalles de la orden al cerrar
          }}
          orderData={selectedOrderDetails} // <-- ¡Esta es la línea que faltaba!
        />
      )}
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  );
}
