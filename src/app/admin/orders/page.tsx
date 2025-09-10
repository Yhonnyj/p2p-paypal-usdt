"use client";

import { OrderFormProvider } from "@/context/OrderFormContext";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import Pusher from "pusher-js";
import type { Order, OrderStatus } from "@/types/order";
import OrdersTable from "@/components/admin/OrdersTable";
import SearchBar from "@/components/admin/SearchBar";
import PaginationControls from "@/components/admin/PaginationControls";
import { Loader2, CircleX, MessageSquareText, Hash, Mail, Wallet, User2, ChevronRight } from "lucide-react";

const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), { ssr: false });

const PAGE_SIZE = 10;

/** Compact card para móviles: no toca tu OrdersTable */
function MobileOrderCard({
  order,
  onOpenChat,
  onStatusChange,
}: {
  order: Order;
  onOpenChat: (o: Order) => void;
  onStatusChange: (id: string, st: OrderStatus) => void;
}) {
  const shortId = useMemo(() => order.id.slice(0, 8), [order.id]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md p-3 xs:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Hash className="size-4 shrink-0" />
          <span className="font-mono">{shortId}</span>
        </div>
        <span
          className={[
            "px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide",
            order.status === "COMPLETED" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
            order.status === "PENDING" && "bg-amber-500/15 text-amber-400 border border-amber-500/20",
            order.status === "CANCELLED" && "bg-rose-500/15 text-rose-400 border border-rose-500/20",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <User2 className="size-4 shrink-0" />
          <span className="truncate">{order.user?.fullName || order.user?.email || "Usuario"}</span>
        </div>
        {order.paypalEmail && (
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{order.paypalEmail}</span>
          </div>
        )}
        {order.wallet && (
          <div className="flex items-center gap-2 text-gray-400">
            <Wallet className="size-4 shrink-0" />
            <span className="truncate">{order.wallet}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => onOpenChat(order)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 active:scale-[.98] transition"
        >
          <MessageSquareText className="size-4" />
          Chat
        </button>

        {/* Acciones rápidas de estado (desplegable simple para pantallas muy pequeñas) */}
        <div className="relative">
          <details className="group">
            <summary className="list-none inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/70 px-3 py-2 text-xs text-gray-200 hover:bg-gray-800 cursor-pointer select-none">
              Estado
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="absolute right-0 z-10 mt-2 min-w-36 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
              {(["PENDING", "COMPLETED", "CANCELLED"] as OrderStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(order.id, st)}
                  className="block w-full px-3 py-2 text-left text-xs text-gray-200 hover:bg-gray-800"
                >
                  {st}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

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

  const paginatedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOrders, page]
  );
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
    <div className="relative min-h-screen text-gray-100 px-3 xs:px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 font-inter overflow-hidden bg-gray-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Fondo premium degradado animado (mantengo tu clase custom si existe) */}
      <div
        className="absolute inset-0 z-0 opacity-[0.08] animate-pulse-light pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981 20%, transparent), radial-gradient(circle at bottom right, #6366F1 20%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Título */}
      <div className="max-w-7xl mx-auto mb-5 sm:mb-8 relative z-10">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg leading-tight">
          Dashboard de Órdenes
        </h1>
      </div>

      {/* Barra de búsqueda */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 relative z-10">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[220px] sm:h-[300px] text-gray-400 text-base sm:text-lg">
            <Loader2 className="animate-spin mb-4" size={28} />
            Cargando órdenes...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[220px] sm:h-[300px] text-rose-400 text-base sm:text-lg">
            <CircleX size={28} className="mb-4" /> {error}
          </div>
        ) : (
          <>
            {/* Vista móvil (cards) */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {paginatedOrders.length === 0 ? (
                <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-center text-gray-400">
                  No hay órdenes.
                </div>
              ) : (
                paginatedOrders.map((o) => (
                  <MobileOrderCard
                    key={o.id}
                    order={o}
                    onOpenChat={handleOpenChat}
                    onStatusChange={updateStatus}
                  />
                ))
              )}
            </div>

            {/* Vista desktop (tabla original) */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-xl shadow-inner shadow-black/10 border border-gray-800 bg-gray-900/40 backdrop-blur-md">
                {/* Para mejorar UX en pantallas medianas con muchas columnas */}
                <div className="min-w-[880px]">
                  <OrdersTable
                    orders={paginatedOrders}
                    onStatusChange={updateStatus}
                    onOpenChat={handleOpenChat}
                  />
                </div>
              </div>
            </div>

            {/* Paginación */}
            <div className="mt-5 sm:mt-6 flex justify-center">
              <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
            </div>
          </>
        )}
      </div>

      {/* Modal de chat */}
      {isChatOpen && selectedOrderId && (
        <OrderFormProvider>
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
        </OrderFormProvider>
      )}

      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
    </div>
  );
}
