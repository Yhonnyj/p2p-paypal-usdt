"use client";

import { useOrderForm } from "@/context/OrderFormContext";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Helpers de formato ----------
const fmtFiatVE = (v: number) =>
  new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number.isFinite(v) ? v : 0
  );

const fmtUSD = (v: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number.isFinite(v) ? v : 0
  );

const fmtCrypto = (v: number) => (Number.isFinite(v) ? v : 0).toFixed(2); // USDT a 2 decimales

const fmtRate = (v: number) =>
  new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number.isFinite(v) ? v : 0
  );

export default function SummaryCard() {
  const {
    // backend-first
    quote,

    // fallback local (si la quote falla/no llegó)
    feePercent,
    dynamicCommission,
    rate,
    selectedDestinationCurrency,
    montoRecibido,
    monto,
  } = useOrderForm();

  // ---------- Con quote del backend ----------
  if (quote) {
    const {
      preDiscountPercent, // % base del canal (BUY/SELL)
      totalPct,           // % total aplicado tras descuento
      userDiscountPercent = 0,
      exchangeRateUsed,
      destinationCurrency,
      totalInDestination,
      netUsd,
      milestone,
    } = quote;

    const cotizacionBase = 1 + preDiscountPercent / 100;
    const cotizacionConDescuento = 1 + totalPct / 100;

    // Siempre 2/3 decimales para resaltar el descuento
    const fmtBase = (x: number) => x.toFixed(2);
    const fmtDesc = (x: number) => x.toFixed(3);

    const hasDiscount = userDiscountPercent > 0;

    const motivoDescuento =
      milestone === "FIRST"
        ? "🎁 ¡Recibiste un 25% de descuento por ser tu primera orden!"
        : milestone === "FIFTH"
        ? "🎉 ¡Obtuviste un 15% de descuento por tu quinta orden!"
        : milestone === "FIFTEEN_PLUS"
        ? "🏅 ¡Gracias por tu fidelidad! Recibiste un 10% de descuento."
        : hasDiscount
        ? "✅ Descuento de fidelidad aplicado automáticamente."
        : "";

    return (
      <div className="w-full mt-6 sm:mt-8">
        <div className="bg-gradient-to-br from-gray-900 to-emerald-950 rounded-2xl border border-gray-700 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-green-500/60 p-4 sm:p-5 md:p-6">
          {/* Grid responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 items-start">
            {/* Izquierda: cotizaciones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium text-sm sm:text-base">
                  Cotización base
                </span>
                <span
                  className={`font-bold text-lg sm:text-xl ${
                    hasDiscount
                      ? "text-gray-400 line-through decoration-red-400 decoration-2"
                      : "text-red-400"
                  }`}
                  title="Antes del descuento de fidelidad"
                >
                  {fmtBase(cotizacionBase)}
                </span>
              </div>

              {hasDiscount && (
                <div className="flex items-start justify-between">
                  <span className="text-emerald-400 font-medium text-sm sm:text-base">
                    Cotización con descuento
                  </span>
                  <div className="flex flex-col items-end -mt-1">
                    <span className="text-[8px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-600 text-emerald-300">
                      −{userDiscountPercent.toFixed(2)}%
                    </span>
                    <span className="text-green-400 font-bold text-lg sm:text-xl mt-1">
                      {fmtDesc(cotizacionConDescuento)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium text-sm sm:text-base">Tasa usada</span>
                <span className="text-gray-200 font-semibold text-sm sm:text-base">
                  {destinationCurrency === "USDT" ? "1.00 (USDT)" : fmtRate(exchangeRateUsed)}
                </span>
              </div>
            </div>

            {/* Derecha: recibirá + neto */}
            <div className="md:text-right">
              <span className="text-gray-300 font-medium block text-sm sm:text-base">
                Usted recibirá
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${(totalInDestination || 0).toFixed(2)}-${destinationCurrency}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-extrabold text-green-400 leading-tight"
                >
                  <span className="whitespace-nowrap">
                    {destinationCurrency === "USDT"
                      ? fmtCrypto(totalInDestination)
                      : fmtFiatVE(totalInDestination)}
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold ml-1 align-top">
                    {destinationCurrency}
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">
                Neto en USD:{" "}
                <span className="text-gray-200 font-semibold">{fmtUSD(netUsd)} USD</span>
              </div>
            </div>
          </div>

          {motivoDescuento && (
            <div className="relative group mt-4 text-emerald-400 leading-snug cursor-default w-full md:w-fit text-sm sm:text-base">
              {motivoDescuento} <span className="ml-1">ℹ️</span>
              <div className="absolute left-0 md:left-auto md:right-0 z-10 mt-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs">
                Mostramos la cotización base (antes del descuento) y la cotización con
                descuento (la que se aplica).
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Fallback local (sin quote) ----------
  if (feePercent === null || rate === null || dynamicCommission === null) return null;

  const cotizacionBase = 1 + (feePercent ?? 0) / 100;
  const cotizacionConDescuento = 1 + (dynamicCommission ?? 0) / 100;
  const hasDiscountLocal = cotizacionConDescuento < cotizacionBase;

  return (
    <div className="w-full mt-6 sm:mt-8">
      <div className="bg-gradient-to-br from-gray-900 to-emerald-950 rounded-2xl border border-gray-700 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-green-500/60 p-4 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium text-sm sm:text-base">
                Cotización base
              </span>
              <span
                className={`font-bold text-lg sm:text-xl ${
                  hasDiscountLocal
                    ? "text-gray-400 line-through decoration-red-400 decoration-2"
                    : "text-red-400"
                }`}
              >
                {cotizacionBase.toFixed(2)}
              </span>
            </div>

            {hasDiscountLocal && (
              <div className="flex items-start justify-between">
                <span className="text-emerald-400 font-medium text-sm sm:text-base">
                  Cotización descuento
                </span>
                <div className="flex flex-col items-end -mt-1">
                  <span className="text-[8px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-600 text-emerald-300">
                    −{(100 * (cotizacionBase - cotizacionConDescuento)).toFixed(2)}%
                  </span>
                  <span className="text-green-400 font-bold text-lg sm:text-xl mt-1">
                    {cotizacionConDescuento.toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium text-sm sm:text-base">Tasa usada</span>
              <span className="text-gray-200 font-semibold text-sm sm:text-base">
                {selectedDestinationCurrency === "USDT" ? "1.00 (USDT)" : fmtRate(rate)}
              </span>
            </div>
          </div>

          <div className="md:text-right">
            <span className="text-gray-300 font-medium block text-sm sm:text-base">
              Usted recibirá
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${montoRecibido}-${selectedDestinationCurrency}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold text-green-400 leading-tight"
              >
                <span className="whitespace-nowrap">
                  {selectedDestinationCurrency === "USDT"
                    ? fmtCrypto(montoRecibido)
                    : fmtFiatVE(montoRecibido)}
                </span>
                <span className="text-xl sm:text-2xl font-semibold ml-1 align-top">
                  {selectedDestinationCurrency}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="text-[11px] sm:text-xs text-gray-400 mt-1">
              Neto en USD:{" "}
              <span className="text-gray-200 font-semibold">
                {fmtUSD(monto * (1 - (dynamicCommission ?? 0) / 100))} USD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
