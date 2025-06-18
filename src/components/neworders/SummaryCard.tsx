"use client";

import { useOrderForm } from "@/context/OrderFormContext";

export default function SummaryCard() {
  const {
    feePercent,
    rate,
    selectedDestinationCurrency,
    montoRecibido,
  } = useOrderForm();

  return (
    <div className="bg-gray-800/60 rounded-2xl p-6 text-base border border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-green-500/50 mt-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-400 font-medium">Cotización del día</span>
        <span className="text-red-400 font-bold text-lg">
          {selectedDestinationCurrency === "USDT"
            ? (feePercent !== null ? (1 + feePercent / 100).toFixed(2) : "Cargando...")
            : (rate !== null ? rate.toFixed(2) : "N/A")}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300 font-medium">Usted recibirá</span>
        <span className="text-green-400 text-2xl font-extrabold flex items-center gap-1">
          {montoRecibido.toFixed(2)}
          <span className="text-xl font-semibold">{selectedDestinationCurrency}</span>
        </span>
      </div>
    </div>
  );
}
