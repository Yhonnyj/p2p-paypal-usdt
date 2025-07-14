"use client";

import { useOrderForm } from "@/context/OrderFormContext";

export default function SummaryCard() {
  const {
    feePercent,
    finalCommission,
    rate,
    selectedDestinationCurrency,
    montoRecibido,
    orderCount,
  } = useOrderForm();

  // Mostrar solo si hay cotización y fee
  if (feePercent === null || rate === null || orderCount === null) return null;

  const baseRate =
    selectedDestinationCurrency === "USDT"
      ? (1 + feePercent / 100).toFixed(2)
      : rate.toFixed(2);

  const commissionAplicada = finalCommission ?? feePercent;

  const rateConDescuento =
    selectedDestinationCurrency === "USDT"
      ? (1 + commissionAplicada / 100).toFixed(2)
      : rate.toFixed(2);

  const descuento = feePercent > commissionAplicada
    ? Math.round(feePercent - commissionAplicada)
    : 0;

  return (
    <div className="bg-gray-800/60 rounded-2xl p-6 text-base border border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-green-500/50 mt-8">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 font-medium">Cotización base</span>
        <div className="text-right">
          <div className="text-red-400 font-bold text-lg">{baseRate}</div>
          {descuento > 0 && (
            <div className="text-emerald-400 text-xs font-medium mt-1">
              🎉 Tienes {descuento}% de descuento en esta operación.
            </div>
          )}
        </div>
      </div>

      {descuento > 0 && (
        <div className="flex justify-between mb-2">
          <span className="text-emerald-400 font-medium">Cotización con descuento</span>
          <span className="text-green-400 font-bold text-lg">{rateConDescuento}</span>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <span className="text-gray-300 font-medium">Usted recibirá</span>
        <span className="text-green-400 text-2xl font-extrabold flex items-center gap-1">
          {montoRecibido.toFixed(2)}
          <span className="text-xl font-semibold">{selectedDestinationCurrency}</span>
        </span>
      </div>

      {descuento > 0 && (
        <p className="text-sm text-emerald-400 mt-3">
          🎁 ¡Recibiste un {descuento}% de descuento especial por ser tu {orderCount === 0 ? "primera" : "nueva"} orden!
        </p>
      )}
    </div>
  );
}
