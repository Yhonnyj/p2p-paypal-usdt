"use client";

import Image from "next/image";
import { useOrderForm } from "@/context/OrderFormContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onReset?: () => void;
}

const currencyLabels: Record<string, string> = {
  USDT: "USDT - Tether",
  BS: "BS - Bolívares",
  COP: "COP - Pesos Colombianos",
};

export default function DestinationSelector({ onReset }: Props) {
  const {
    selectedDestinationCurrency,
    setSelectedDestinationCurrency,
    exchangeRates,
  } = useOrderForm();

  const getCurrencyImage = (currency: string) =>
    `/images/${currency.toLowerCase()}.png`;

  const availableFiatCurrencies = exchangeRates.filter((r) => r.currency !== "USD");

  return (
    <div className="mt-6">
      <label className="text-sm text-white mb-2 block font-medium">Destino</label>

      <div className="relative w-full flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-700 shadow px-4 py-3">
        {/* Icono de moneda animado */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDestinationCurrency}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Image
              src={getCurrencyImage(selectedDestinationCurrency)}
              alt={`${selectedDestinationCurrency} icon`}
              width={40}
              height={40}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = "/images/bs.png";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Select personalizado */}
        <div className="relative w-full flex-grow">
          <select
            value={selectedDestinationCurrency}
            onChange={(e) => {
              setSelectedDestinationCurrency(e.target.value);
              onReset?.();
            }}
            className="appearance-none w-full bg-transparent text-white text-sm sm:text-base pr-8 py-2 focus:outline-none cursor-pointer"
          >
            <option value="USDT">{currencyLabels["USDT"]}</option>
            {availableFiatCurrencies.map((r) => (
              <option key={r.currency} value={r.currency}>
                {currencyLabels[r.currency] || r.currency}
              </option>
            ))}
          </select>

          {/* Flecha personalizada */}
          <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-white">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
