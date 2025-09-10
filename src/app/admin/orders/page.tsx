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
import {
  Loader2,
  CircleX,
  MessageSquareText,
  Hash,
  Mail,
  Wallet,
  User2,
  ChevronRight,
  Banknote,
  Building2,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";

const OrderChatModal = dynamic(() => import("@/components/OrderChatModal"), { ssr: false });

const PAGE_SIZE = 10;

/* ------------ Helpers UI ------------ */
function cx(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}
function formatMoney(v?: number | string, currency = "USD") {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
/** Intenta leer objetos JSON guardados como string (wallet/bank details) y devuelve líneas bonitas */
function parsePrettyDetails(raw?: string): { line1?: string; line2?: string } {
  if (!raw) return {};
  // si ya viene algo corto y legible, lo dejamos
  if (!raw.trim().startsWith("{")) return { line1: raw };
  try {
    const obj = JSON.parse(raw);
    // Casos comunes:
    // { bankName, accountNumber, alias, cbu, rut, dni, clabe, phone, owner }
    const bank = obj.bankName || obj.bank || obj.institution;
    const acc =
      obj.accountNumber ||
      obj.account ||
      obj.cbu ||
      obj.clabe ||
      obj.rut ||
      obj.cvu ||
      obj.phone ||
      obj.alias;
    const owner = obj.owner || obj.holder || obj.name;
    let line1 = [bank, owner].filter(Boolean).join(" · ");
    let line2 = acc ? String(acc) : undefined;
    return { line1: line1 || undefined, line2 };
  } catch {
    // fallback: corta el JSON para que no destruya el layout
    return { line1: raw.slice(0, 60) + (raw.length > 60 ? "…" : "") };
  }
}
function getCurrency(order: Order) {
  // mejor esfuerzo
  return (order as any).currency || (order as any).destinationCurrency || "USD";
}
function getAmount(order: Order) {
  // mejor esfuerzo con nombres típicos
  const o: any = order as any;
  return o.amountUsd ?? o.amount ?? o.totalUsd ?? o.usd ?? o.netUsd ?? undefined;
}
function getSide(order: Order) {
  return ((order as any).side as string | undefined)?.toUpperCase?.() || undefined;
}
function getChannel(order: Order) {
  return (order as any).paymentChannelKey || (order as any).paymentChannel || undefined;
}

/** -------- Card móvil mejorada -------- */
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
  const amount = getAmount(order);
  const currency = getCurrency(order);
  const side = getSide(order); // BUY / SELL
  const channel = getChannel(order);
  const pretty = parsePrettyDetails(order.wallet);

  const StatusBadge = (
    <span
      className={cx(
        "px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide border",
        order.status === "COMPLETED" && "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
        order.status === "PENDING" && "bg-amber-500/12 text-amber-400 border-amber-500/20",
        order.status === "CANCELLED" && "bg-rose-500/12 text-rose-400 border-rose-500/20"
      )}
    >
      {order.status}
    </span>
  );

  const SideBadge =
    side && (
      <span
        className={cx(
          "px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide border",
          side === "BUY" && "bg-sky-500/12 text-sky-300 border-sky-500/20",
          side === "SELL" && "bg-fuchsia-500/12 text-fuchsia-300 border-fuchsia-500/20"
        )}
      >
        {side}
      </span>
    );

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md p-3 xs:p-4 flex flex-col gap-3 shadow-[0_6px_20px_-12px_rgba(0,0,0,.6)]">
      {/* Top row: ID + badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Hash className="size-4 shrink-0" />
          <span className="font-mono">{shortId}</span>
        </div>
        <div className="flex items-center gap-1.5">{SideBadge}{StatusBadge}</div>
      </div>

      {/* Amount destacado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-200">
          <Banknote className="size-5 shrink-0" />
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-gray-400">Monto</div>
            <div className="text-lg font-semibold">
              {formatMoney(amount, currency)}
            </div>
          </div>
        </div>
        {channel && (
          <div className="hidden xs:flex items-center gap-2 text-gray-300">
            <Building2 className="size-4" />
            <span className="text-xs px-2 py-1 rounded-lg bg-gray-800/70 border border-gray-700">
              {channel}
            </span>
          </div>
        )}
      </div>

      {/* Datos de usuario */}
      <div className="grid grid-cols-1 gap-2 text-[13px]">
        <div className="flex items-center gap-2 text-gray-200">
          <User2 className="size-4 shrink-0" />
          <span className="truncate">{order.user?.fullName || order.user?.email || "Usuario"}</span>
        </div>
        {order.paypalEmail && (
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{order.paypalEmail}</span>
          </div>
        )}

        {/* Detalle destino (wallet / banco) limpiamente, sin JSON crudo */}
        {(pretty.line1 || pretty.line2) && (
          <div className="flex items-start gap-2 text-gray-400">
            <Wallet className="size-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              {pretty.line1 && <div className="truncate">{pretty.line1}</div>}
              {pretty.line2 && <div className="truncate text-gray-500 text-[12px]">{pretty.line2}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => onOpenChat(order)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 active:scale-[.98] transition"
        >
          <MessageSquareText className="size-4" />
          Chat
        </button>

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

      {/* Extra collapsible con más info sin ruido */}
      {(channel || (order as any).appliedCommissionPct) && (
        <details className="mt-1">
          <summary className="text-[11px] text-gray-500 cursor-pointer select-none hover:text-gray-400">
            Ver más
          </summary>
          <div className="mt-2 grid gap-1.5 text-[12px] text-gray-400">
            {channel && (
              <div><span className="text-gray-500">Canal:</span> {channel}</div>
            )}
            {(order as any).appliedCommissionPct != null && (
              <div>
                <span className="text-gray-500">Comisión aplicada:</span>{" "}
                {(order as any).appliedCommissionPct}%
              </div>
            )}
            {(order as any).exchangeRateUsed != null && (
              <div>
                <span className="text-gray-500">Tasa usada:</span>{" "}
                {(order as any).exchangeRateUsed}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/* ------------ Page ------------ */
const PAGE_SIZE_STATEFUL = PAGE_SIZE;

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
    () => filteredOrders.slice((page - 1) * PAGE_SIZE_STATEFUL, page * PAGE_SIZE_STATEFUL),
    [filteredOrders, page]
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE_STATEFUL));

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
    const filtered = orders.filter((order) =>
      [
        order.user.fullName,
        order.user.email,
        order.paypalEmail,
        order.wallet,
        order.id,
        (getChannel(order) || ""),
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term))
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
      {/* Fondo premium */}
      <div
        className="absolute inset-0 z-0 opacity-[0.08] animate-pulse-light pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981 18%, transparent), radial-gradient(circle at bottom right, #6366F1 18%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Título */}
      <div className="max-w-7xl mx-auto mb-5 sm:mb-8 relative z-10">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg leading-tight">
          Dashboard de Órdenes
        </h1>
      </div>

      {/* Búsqueda */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 relative z-10">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Contenido */}
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
            {/* Móvil: cards limpias */}
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

            {/* Desktop: tu tabla intacta */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-xl shadow-inner shadow-black/10 border border-gray-800 bg-gray-900/40 backdrop-blur-md">
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
