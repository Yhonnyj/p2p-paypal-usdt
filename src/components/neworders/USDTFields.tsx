"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
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

  const selected = networkOptions.find((n) => n.value === network);

  return (
    <div className="mt-6 w-full">
      <label className="text-sm text-gray-300 mb-2 block font-medium">
        Red para recibir USDT
      </label>

      <Listbox value={network} onChange={(value) => setNetwork(value)}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 border border-gray-700 py-2 pl-3 pr-10 text-left shadow-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <span className="flex items-center gap-3">
              <Image
                src={selected?.img || "/images/placeholder.png"}
                alt=""
                width={40}
                height={40}
                className="h-7 w-7 rounded-full object-contain"
              />
              <span className="block truncate text-base">{selected?.label}</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-white" aria-hidden="true" />
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
