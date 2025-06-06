"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.user.fullName?.toLowerCase().includes(term) ||
        order.user.email?.toLowerCase().includes(term) ||
        order.paypalEmail?.toLowerCase().includes(term) ||
        order.wallet?.toLowerCase().includes(term)
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
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Error actualizando estado");
    }
  };

  const handleRowClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Dashboard Admin</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, email, PayPal o wallet"
        className="mb-6 w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
      />

      {loading ? (
        <p className="text-center mt-10">Cargando órdenes...</p>
      ) : error ? (
        <p className="text-center mt-10 text-red-500">{error}</p>
      ) : filteredOrders.length === 0 ? (
        <p>No hay órdenes encontradas.</p>
      ) : (
        <>
          <table className="w-full border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-3 border-b border-gray-700 text-left">Nombre</th>
                <th className="p-3 border-b border-gray-700 text-left">Email</th>
                <th className="p-3 border-b border-gray-700 text-left">PayPal</th>
                <th className="p-3 border-b border-gray-700 text-left">Wallet</th>
                <th className="p-3 border-b border-gray-700 text-left">Plataforma</th>
                <th className="p-3 border-b border-gray-700 text-right">Monto USD</th>
                <th className="p-3 border-b border-gray-700 text-right">USDT</th>
                <th className="p-3 border-b border-gray-700 text-left">Estado</th>
                <th className="p-3 border-b border-gray-700 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => handleRowClick(order.id)}
                  className="hover:bg-gray-800 cursor-pointer"
                >
                  <td className="p-3 border-b border-gray-700">{order.user?.fullName ?? "—"}</td>
                  <td className="p-3 border-b border-gray-700">{order.user?.email ?? "—"}</td>
                  <td className="p-3 border-b border-gray-700">{order.paypalEmail}</td>
                  <td className="p-3 border-b border-gray-700">{order.wallet}</td>
                  <td className="p-3 border-b border-gray-700">{order.platform}</td>
                  <td className="p-3 border-b border-gray-700 text-right">${order.amount.toFixed(2)}</td>
                  <td className="p-3 border-b border-gray-700 text-right text-green-400 font-semibold">
                    {order.finalUsdt.toFixed(2)} USDT
                  </td>
                  <td className="p-3 border-b border-gray-700">
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="bg-gray-800 text-white rounded px-2 py-1"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="COMPLETED">Pagado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </td>
                  <td className="p-3 border-b border-gray-700">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {isChatOpen && selectedOrderId && (
        <OrderChatModal
          orderId={selectedOrderId}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedOrderId(null);
          }}
        />
      )}
    </div>
  );
}
