"use client";

import { MessageSquareText, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";

interface Props {
  orders: Order[];
  onOpenChat: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

const getStatusDisplay = (status: OrderStatus) => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1";
  switch (status) {
    case "PENDING":
      return <span className={`${baseClass} bg-yellow-600/20 text-yellow-300`}><Clock className="w-4 h-4" /> Pendiente</span>;
    case "COMPLETED":
      return <span className={`${baseClass} bg-green-600/20 text-green-300`}><CheckCircle className="w-4 h-4" /> Completada</span>;
    case "CANCELLED":
      return <span className={`${baseClass} bg-red-600/20 text-red-300`}><XCircle className="w-4 h-4" /> Cancelada</span>;
    default:
      return null;
  }
};

export default function OrdersTable({ orders, onOpenChat, onStatusChange }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-inner bg-gray-900/60 backdrop-blur-sm">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="text-gray-300 bg-gray-800/70 uppercase tracking-wider text-xs">
            <th className="px-4 py-3 whitespace-nowrap">ID</th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3 hidden lg:table-cell">PayPal</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Monto</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Recibe</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onOpenChat(order)}
              className="cursor-pointer border-t border-gray-800 hover:bg-gray-800/40 transition-all"
            >
              <td className="px-4 py-4 font-mono text-xs text-gray-400 truncate w-[90px]">
                {order.id.substring(0, 8)}...
              </td>

              <td className="px-4 py-4">
                <div className="font-semibold text-gray-200 max-w-[120px] truncate">{order.user?.fullName || "—"}</div>
                <div className="text-xs text-gray-400 truncate">{order.user?.email || "—"}</div>
              </td>

              <td className="px-4 py-4 hidden lg:table-cell text-gray-300 truncate">{order.paypalEmail}</td>

              <td className="px-4 py-4 text-right hidden sm:table-cell font-bold text-blue-400">
                ${order.amount.toFixed(2)}
              </td>

              <td className="px-4 py-4 text-right hidden sm:table-cell font-bold text-green-400">
                {order.finalUsdt
                  ? `${order.finalUsdt.toFixed(2)} USDT`
                  : `${order.finalUsd.toFixed(2)} ${order.to}`}
              </td>

              {/* Estado visible en todas las pantallas */}
              <td className="px-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  {getStatusDisplay(order.status)}

                  <select
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                    className="bg-gray-700 text-white rounded-md px-3 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </td>

              <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-2">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenChat(order); }}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition"
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
  );
}
