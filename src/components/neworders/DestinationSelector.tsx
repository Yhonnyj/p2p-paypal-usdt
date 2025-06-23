"use client";

import Image from "next/image";
import { useOrderForm } from "@/context/OrderFormContext";

interface Props {
  onReset?: () => void;
}

export default function DestinationSelector({ onReset }: Props) {
  const {
    selectedDestinationCurrency,
    setSelectedDestinationCurrency,
    exchangeRates,
  } = useOrderForm();

  const getCurrencyImage = (currency: string) => {
    if (currency === "USDT") return "/images/usdt.png";
    return `/images/${currency.toLowerCase()}.png`;
  };

  const availableFiatCurrencies = exchangeRates.filter(r => r.currency !== "USD");

  return (
    <div className="mt-6">
      <label className="text-sm text-gray-300 mb-2 block font-medium">Destino</label>
      <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
        <div className="p-2 flex items-center justify-center">
          <Image
            src={getCurrencyImage(selectedDestinationCurrency)}
            alt={`${selectedDestinationCurrency} icon`}
            width={40}
            height={40}
            className="rounded-full object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/images/bs.png";
            }}
          />
        </div>
        <select
          value={selectedDestinationCurrency}
          onChange={(e) => {
            setSelectedDestinationCurrency(e.target.value);
            onReset?.(); // Si onReset existe, lo ejecuta
          }}
          className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none cursor-pointer"
        >
          <option value="USDT">USDT</option>
          {availableFiatCurrencies.map((r) => (
            <option key={r.currency} value={r.currency}>
              {r.currency}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
