"use client";

import Image from "next/image";
import { useOrderForm } from "@/context/OrderFormContext";

const networkOptions = [
  { value: "TRC20", label: "TRC20 (Tron)", img: "/images/trc20.png" },
  { value: "BEP20", label: "BNB Smart Chain (BEP20)", img: "/images/bep20.png" },
  { value: "ARBITRUM", label: "Arbitrum One", img: "/images/arbitrum.png" },
  { value: "BINANCE_PAY", label: "Binance Pay", img: "/images/binance_pay.png" },
];

export default function USDTFields() {
  const {
    selectedDestinationCurrency,
    network,
    setNetwork,
    wallet,
    setWallet,
  } = useOrderForm();

  if (selectedDestinationCurrency !== "USDT") return null;

  const getNetworkImage = (networkValue: string) =>
    networkOptions.find((opt) => opt.value === networkValue)?.img || "/images/placeholder.png";

  return (
    <div className="mt-6">
      <label className="text-sm text-gray-300 mb-2 block font-medium">
        Red para recibir USDT
      </label>

      <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
        <div className="p-2">
          <Image
            src={getNetworkImage(network)}
            alt="Network Icon"
            width={40}
            height={40}
            className="rounded-full object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/images/placeholder.png";
            }}
          />
        </div>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none cursor-pointer"
        >
          {networkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <label className="text-sm text-gray-300 mb-1 block font-medium">
          {network === "BINANCE_PAY" ? "User ID de Binance Pay" : "Wallet USDT"}
        </label>
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder={
            network === "BINANCE_PAY"
              ? "Ej: 123456789"
              : network === "TRC20"
              ? "Ej: TNdzfERDpxLDS2w1..."
              : "Ej: 0x4499AD..."
          }
          className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
        />
      </div>
    </div>
  );
}
