"use client";

import {
  MessageSquareText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";

interface Props {
  orders: Order[];
  onOpenChat: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

// Status display simple - sin cálculos
const getStatusDisplay = (status: OrderStatus) => {
  const baseClass =
    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border";

  switch (status) {
    case "PENDING":
      return (
        <span
          className={`${baseClass} bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30`}
        >
          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pendiente
        </span>
      );
    case "COMPLETED":
      return (
        <span
          className={`${baseClass} bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30`}
        >
          <CheckCircle className="w-3.5 h-3.5" /> Completada
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`${baseClass} bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30`}
        >
          <XCircle className="w-3.5 h-3.5" /> Cancelada
        </span>
      );
    default:
      return null;
  }
};

// Mostrar profit que viene del backend
const ProfitIndicator = ({ profit }: { profit?: number }) => {
  if (profit === null || profit === undefined) {
    return <span className="text-xs text-gray-500">N/A</span>;
  }

  const isPositive = profit > 0;

  return (
    <div className="flex items-center gap-1 text-xs">
      <TrendingUp
        className={`w-3 h-3 ${
          isPositive ? "text-emerald-400" : "text-red-400 rotate-180"
        }`}
      />
      <span
        className={`font-semibold ${
          isPositive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        ${Math.abs(profit).toFixed(2)}
      </span>
    </div>
  );
};

export default function OrdersTable({
  orders,
  onOpenChat,
  onStatusChange,
}: Props) {
  // Stats simples - solo conteos, sin cálculos complejos
  const stats = {
    totalVolume: orders.reduce((sum, order) => sum + order.amount, 0),
    pendingCount: orders.filter((o) => o.status === "PENDING").length,
    completedCount: orders.filter((o) => o.status === "COMPLETED").length,
    cancelledCount: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // ✅ Profit total de la página (sólo órdenes COMPLETED)
  const totalProfitPage = orders.reduce((sum: number, o: Order) => {
    if (o.status === "COMPLETED" && typeof o.profit === "number") {
      return sum + o.profit;
    }
    return sum;
  }, 0);

  const successRate =
    orders.length > 0 ? (stats.completedCount / orders.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header con stats básicos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-emerald-400">Volumen</div>
              <div className="text-lg font-bold text-white">
                ${stats.totalVolume.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xs text-yellow-400">Pendientes</div>
              <div className="text-lg font-bold text-white">
                {stats.pendingCount}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-xs text-green-400">Completadas</div>
              <div className="text-lg font-bold text-white">
                {stats.completedCount}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-red-400">Canceladas</div>
              <div className="text-lg font-bold text-white">
                {stats.cancelledCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl bg-gray-950 bg-[radial-gradient(circle_at_top_left,#10B981,transparent),radial-gradient(circle_at_bottom_right,#6366F1,transparent)] backdrop-blur-sm">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-300 bg-gray-800/90 uppercase tracking-wider text-xs border-b border-gray-700">
              <th className="px-4 py-4">Usuario</th>
              <th className="px-4 py-4 hidden lg:table-cell">PayPal</th>
              <th className="px-4 py-4 text-right">Monto</th>
              <th className="px-4 py-4 text-right hidden sm:table-cell">
                Recibe
              </th>
              <th className="px-4 py-4 text-center">Profit</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                onClick={() => onOpenChat(order)}
                className={`cursor-pointer border-t border-gray-800/50 hover:bg-gray-800/60 transition-all duration-200 group ${
                  index % 2 === 0 ? "bg-gray-900/20" : "bg-gray-900/40"
                }`}
              >
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-200 max-w-[120px] truncate group-hover:text-white transition-colors">
                    {order.user?.fullName || "—"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {order.user?.email || "—"}
                  </div>
                </td>

                <td className="px-4 py-4 hidden lg:table-cell text-gray-300 truncate font-mono text-xs">
                  {order.paypalEmail}
                </td>

                <td className="px-4 py-4 text-right">
                  <div className="font-bold text-blue-400 text-lg group-hover:text-blue-300 transition-colors">
                    ${order.amount.toFixed(2)}
                  </div>
                </td>

                <td className="px-4 py-4 text-right hidden sm:table-cell">
                  <div className="font-bold text-green-400 group-hover:text-green-300 transition-colors">
                    {order.finalUsdt
                      ? `${order.finalUsdt.toFixed(2)} USDT`
                      : `${order.finalUsd.toFixed(2)} ${order.to}`}
                  </div>
                </td>

                {/* Profit que viene del backend */}
                <td className="px-4 py-4 text-center">
                  <ProfitIndicator profit={order.profit} />
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    {getStatusDisplay(order.status)}
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      className="bg-gray-700/80 hover:bg-gray-600 text-white rounded-lg px-3 py-1.5 text-xs border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-sm"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="COMPLETED">Completada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>
                </td>

                <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                  <div className="font-medium text-gray-300">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(order);
                      }}
                      className="p-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-full shadow-lg transition-all transform hover:scale-110 group-hover:shadow-blue-500/25"
                      title="Abrir chat"
                    >
                      <MessageSquareText className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con tasa de éxito y profit de la página */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="text-gray-400">
            Mostrando{" "}
            <span className="text-white font-semibold">{orders.length}</span>{" "}
            órdenes
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-gray-400">
              Tasa éxito:{" "}
              <span className="text-blue-400 font-semibold">
                {successRate.toFixed(1)}%
              </span>
            </div>

            <div className="text-gray-400">
              Profit pág.:{" "}
              <span
                className={`font-semibold ${
                  totalProfitPage >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                ${Math.abs(totalProfitPage).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
