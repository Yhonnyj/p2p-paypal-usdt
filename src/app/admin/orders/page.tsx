"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import Pusher from "pusher-js";
import type { Order, OrderStatus } from "@/types/order";
import OrdersTable from "@/components/admin/OrdersTable";
import SearchBar from "@/components/admin/SearchBar";
import PaginationControls from "@/components/admin/PaginationControls";
import { Loader2, CircleX } from "lucide-react";

const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), {
  ssr: false,
});

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

  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    const fetchInitialOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) throw new Error("Error cargando órdenes");
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Error desconocido");
        toast.error(`Error: ${error.message}`);
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

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error actualizando estado");

      const updatedOrder: Order = await res.json();

      if (selectedOrderDetails?.id === updatedOrder.id) {
        setSelectedOrderDetails({ ...selectedOrderDetails, status: updatedOrder.status });
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...updatedOrder, user: o.user } : o))
      );
      toast.success(`Orden ${orderId.substring(0, 8)}... actualizada a ${newStatus}.`);
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar: ${error.message}`);
    }
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrderDetails(order);
    setSelectedOrderId(order.id);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-inter overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10" style={{
        background: 'radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg">
          Dashboard de Órdenes
        </h1>

        <SearchBar value={search} onChange={setSearch} />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-lg">
            <Loader2 className="animate-spin mb-4" size={32} />
            Cargando órdenes...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 text-lg">
            <CircleX size={32} className="mb-4" /> {error}
          </div>
        ) : (
          <>
            <OrdersTable
              orders={paginatedOrders}
              onStatusChange={updateStatus}
              onOpenChat={handleOpenChat}
            />
            <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
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
            setSelectedOrderDetails(null);
          }}
          orderData={selectedOrderDetails}
        />
      )}

      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
    </div>
  );
}
