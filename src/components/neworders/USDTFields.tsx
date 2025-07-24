"use client";

import { useEffect, useState, Fragment, forwardRef, useImperativeHandle } from "react";
import { useOrderForm } from "@/context/OrderFormContext";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown as ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";

interface PaymentMethod {
  id: string;
  type: string;
  details: {
    address?: string;
    network?: string;
  };
}

const networkOptions = [
  { value: "BINANCE_PAY", label: "Binance Pay", img: "/images/binance_pay.png" },
  { value: "TRC20", label: "TRC20 (Tron)", img: "/images/trc20.png" },
  { value: "BEP20", label: "BNB Smart Chain (BEP20)", img: "/images/bep20.png" },
  { value: "ARBITRUM", label: "Arbitrum One", img: "/images/arbitrum.png" },
];

const USDTFields = forwardRef((_, ref) => {
  const { selectedDestinationCurrency, network, setNetwork, wallet, setWallet } = useOrderForm();

  const [wallets, setWallets] = useState<PaymentMethod[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // --- Cargar wallets USDT guardadas ---
  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Error al cargar wallets USDT");
      const data: PaymentMethod[] = await res.json();
      const usdtWallets = data.filter((m) => m.type === "USDT");
      setWallets(usdtWallets);

      if (usdtWallets.length > 0 && !isAddingNew) {
        const first = usdtWallets[0];
        setSelectedWalletId(first.id);
        setWallet(first.details.address || "");
        setNetwork(first.details.network || "TRC20");
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron cargar las wallets USDT.");
    }
  };

  useEffect(() => {
    if (selectedDestinationCurrency === "USDT") fetchWallets();
  }, [selectedDestinationCurrency]);

  // --- Guardar wallet solo cuando se llame desde "Continuar" ---
  const handleSaveWallet = async () => {
    if (!wallet) return; // No guardar si está vacío
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "USDT",
          details: { address: wallet, network },
        }),
      });

      if (!res.ok) throw new Error("Error al guardar wallet");
      toast.success("Wallet USDT guardada con la orden.");
      setIsAddingNew(false);
      await fetchWallets();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la wallet.");
    }
  };

  useImperativeHandle(ref, () => ({
    saveUSDTWallet: handleSaveWallet,
  }));

  if (selectedDestinationCurrency !== "USDT") return null;

  const selectedNetwork = networkOptions.find((n) => n.value === network);

  return (
    <div className="mt-6 w-full space-y-6">
      {/* Wallets USDT guardadas */}
      {wallets.length > 0 && !isAddingNew ? (
        <>
          {(showAll ? wallets : wallets.slice(0, 2)).map((w) => {
            const isSelected = w.id === selectedWalletId;
            const netImg =
              networkOptions.find((n) => n.value === w.details.network)?.img || "/images/trc20.png";
            return (
              <div
                key={w.id}
                onClick={() => {
                  setSelectedWalletId(w.id);
                  setWallet(w.details.address || "");
                  setNetwork(w.details.network || "TRC20");
                }}
                className={`relative w-full rounded-xl p-4 shadow-md cursor-pointer transition border 
                  ${isSelected ? "border-emerald-500 bg-gray-700" : "border-gray-700 bg-gray-800 hover:border-emerald-500"}`}
              >
                <div className="flex items-center gap-3">
                  <Image src={netImg} alt="Network" width={32} height={32} className="rounded-full" />
                  <div className="flex-1">
                    <p className="text-white text-sm">{w.details.address}</p>
                    <p className="text-gray-400 text-xs">Red: {w.details.network}</p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-emerald-400" />}
                </div>
              </div>
            );
          })}
          <div className="flex justify-between items-center mt-2">
            {wallets.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-emerald-400 text-xs hover:text-emerald-300"
              >
                {showAll ? "Ver menos" : "Ver más"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setWallet("");
                setSelectedWalletId(null);
                setIsAddingNew(true);
              }}
              className="text-emerald-400 text-xs hover:text-emerald-300"
            >
              Agregar nueva
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Selector de red */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-medium">
              Red para recibir USDT
            </label>

            <Listbox value={network} onChange={(value) => setNetwork(value)}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 border border-gray-700 py-2 pl-3 pr-10 text-left shadow-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <span className="flex items-center gap-3">
                    <Image
                      src={selectedNetwork?.img || "/images/placeholder.png"}
                      alt=""
                      width={40}
                      height={40}
                      className="h-7 w-7 rounded-full object-contain"
                    />
                    <span className="block truncate text-base">{selectedNetwork?.label}</span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                </Listbox.Button>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {networkOptions.map((net) => (
                      <Listbox.Option
                        key={net.value}
                        value={net.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active ? "bg-emerald-700 text-white" : "text-gray-200"
                          }`
                        }
                      >
                        <span className="flex items-center gap-3">
                          <Image
                            src={net.img}
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full object-contain"
                          />
                          <span className="block truncate text-sm">{net.label}</span>
                        </span>
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Input de wallet */}
          <div className="mt-6">
            <label className="text-sm text-gray-300 mb-2 block font-medium leading-6">
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
        </>
      )}
    </div>
  );
});

USDTFields.displayName = "USDTFields";
export default USDTFields;
