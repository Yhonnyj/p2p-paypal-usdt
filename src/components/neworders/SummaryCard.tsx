"use client";

import { useOrderForm } from "@/context/OrderFormContext";
import { motion, AnimatePresence } from "framer-motion";

export default function SummaryCard() {
  const {
    // backend (preferido)
    quote,
    orderCount,

    // fallback local
    feePercent,
    dynamicCommission,
    rate,
    selectedDestinationCurrency,
    montoRecibido,
  } = useOrderForm();

  // ---------- Con quote del backend ----------
  if (quote) {
    const {
      totalPct,             // % total aplicado (base + canal - descuento)
      netUsd,               // USD neto después del totalPct
      exchangeRateUsed,     // 1 si USDT, o tasa fiat
      totalInDestination,   // netUsd convertido a destino
      destinationCurrency,  // "USDT" o fiat
      userDiscountPercent,  // descuento aplicado (si lo usas)
    } = quote;

    // Mensaje de “premio” por frecuencia (con orderCount)
    let motivoDescuento = "";
    if (typeof orderCount === "number") {
      const currentOrderNumber = orderCount + 1;
      if (currentOrderNumber === 1) {
        motivoDescuento = "🎁 ¡Recibiste un 50% de descuento por ser tu primera orden!";
      } else if (currentOrderNumber === 5) {
        motivoDescuento = "🎉 ¡Obtuviste un 18% de descuento por tu quinta orden!";
      } else if (currentOrderNumber >= 15) {
        motivoDescuento = "🏅 ¡Gracias por tu fidelidad! Recibiste un 10% de descuento.";
      }
    }

    return (
      <div className="bg-gradient-to-br from-gray-900 to-emerald-950 rounded-2xl p-4 sm:p-6 text-sm sm:text-base border border-gray-700 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-green-500/60 mt-6 sm:mt-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 items-start">
          {/* Columna Izquierda: detalles compactos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-t border-gray-700 pt-2">
              <span className="text-gray-300 font-medium">% Total aplicado</span>
              <span className="text-red-400 font-bold text-lg sm:text-xl">
                {totalPct.toFixed(2)}%
              </span>
            </div>

            {typeof userDiscountPercent === "number" && userDiscountPercent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-medium">Incluye descuento</span>
                <span className="text-emerald-400 font-semibold">
                  -{userDiscountPercent.toFixed(2)}%
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Tasa usada</span>
              <span className="text-gray-200 font-semibold">
                {destinationCurrency === "USDT" ? "1.00 (USDT)" : exchangeRateUsed.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Columna Derecha: monto recibido */}
          <div>
            <span className="text-gray-300 font-medium block">Usted recibirá</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${totalInDestination.toFixed(2)}-${destinationCurrency}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="text-green-400 text-3xl font-extrabold block"
              >
                {totalInDestination.toFixed(2)}
                <span className="text-xl font-semibold ml-1">{destinationCurrency}</span>
              </motion.div>
            </AnimatePresence>

            <div className="text-xs text-gray-400 mt-1">
              Neto en USD:{" "}
              <span className="text-gray-200 font-semibold">{netUsd.toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* Mensaje de premio por número de órdenes */}
        {motivoDescuento && (
          <div className="relative group mt-4 text-sm sm:text-base text-emerald-400 leading-snug cursor-pointer w-fit">
            {motivoDescuento}
            <span className="ml-1">ℹ️</span>
            <div className="absolute left-0 z-10 mt-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs">
              El descuento se aplica automáticamente sobre la comisión total según tu historial.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- Fallback: lógica local (tu versión anterior) ----------
  if (
    feePercent === null ||
    rate === null ||
    orderCount === null ||
    dynamicCommission === null
  )
    return null;

  const baseRate =
    selectedDestinationCurrency === "USDT"
      ? (1 + feePercent / 100).toFixed(2)
      : rate.toFixed(2);

  const rateConDescuento =
    selectedDestinationCurrency === "USDT"
      ? (1 + dynamicCommission / 100).toFixed(2)
      : rate.toFixed(2);

  const descuento = Math.round(feePercent - dynamicCommission);
  const currentOrderNumber = orderCount + 1;

  let motivoDescuento = "";
  if (currentOrderNumber === 1) {
    motivoDescuento = "🎁 ¡Recibiste un 50% de descuento por ser tu primera orden!";
  } else if (currentOrderNumber === 5) {
    motivoDescuento = "🎉 ¡Obtuviste un 18% de descuento por tu quinta orden!";
  } else if (currentOrderNumber >= 15) {
    motivoDescuento = "🏅 ¡Gracias por tu fidelidad! Recibiste un 10% de descuento.";
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-emerald-950 rounded-2xl p-4 sm:p-6 text-sm sm:text-base border border-gray-700 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-green-500/60 mt-6 sm:mt-8 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 items-start">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Cotización base</span>
            <span className="text-red-400 font-bold text-lg sm:text-xl">{baseRate}</span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-emerald-400 font-medium">Cotización con descuento</span>
              <span className="text-green-400 font-bold text-lg sm:text-xl">
                {rateConDescuento}
              </span>
            </div>
          )}
        </div>

        <div>
          <span className="text-gray-300 font-medium block">Usted recibirá</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={montoRecibido.toFixed(2)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="text-green-400 text-3xl font-extrabold block"
            >
              {montoRecibido.toFixed(2)}
              <span className="text-xl font-semibold ml-1">
                {selectedDestinationCurrency}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {descuento > 0 && motivoDescuento && (
        <div className="relative group mt-4 text-sm sm:text-base text-emerald-400 leading-snug cursor-pointer w-fit">
          {motivoDescuento}
          <span className="ml-1">ℹ️</span>
          <div className="absolute left-0 z-10 mt-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs">
            Esto se calcula en base a tu historial de órdenes y se aplica sobre la comisión base.
          </div>
        </div>
      )}
    </div>
  );
}
