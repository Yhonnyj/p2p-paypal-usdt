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
    <div className="overflow-x-auto rounded-2xl shadow-2xl border border-gray-800 bg-gray-900">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="text-gray-300 bg-gray-800 uppercase tracking-wider">
            <th className="px-6 py-4 rounded-tl-2xl">ID</th>
            <th className="px-6 py-4">Usuario</th>
            <th className="px-6 py-4">PayPal</th>
            <th className="px-6 py-4 text-right">Monto</th>
            <th className="px-6 py-4 text-right">Recibe</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 rounded-tr-2xl">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr
              key={order.id}
              onClick={() => onOpenChat(order)}
              className={`transition-all duration-150 ease-in-out cursor-pointer border-t border-gray-800 ${
                index % 2 === 0 ? "bg-gray-900" : "bg-gray-850"
              } hover:bg-gray-800/60`}
            >
              <td className="px-6 py-4 font-mono text-xs text-gray-400 truncate w-[120px]">{order.id.substring(0, 8)}...</td>
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-200 truncate max-w-[160px]">{order.user?.fullName || "—"}</div>
                <div className="text-gray-400 text-xs truncate max-w-[180px]">{order.user?.email || "—"}</div>
              </td>
              <td className="px-6 py-4 text-gray-300 truncate max-w-[180px]">{order.paypalEmail}</td>
              <td className="px-6 py-4 text-right font-bold text-blue-400">${order.amount.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-bold text-green-400">
                {order.finalUsdt ? `${order.finalUsdt.toFixed(2)} USDT` : `${order.finalUsd.toFixed(2)} ${order.to}`}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
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
              <td className="px-6 py-4 text-xs text-gray-400">
                <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-2">
                  {new Date(order.createdAt).toLocaleTimeString()}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenChat(order); }}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all"
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
