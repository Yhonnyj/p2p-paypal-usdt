"use client";

import { useState, Fragment } from "react";
import { Dialog, Tab, Transition, Listbox } from "@headlessui/react";
import { bankOptions } from "@/lib/bankOptions";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

const tabs = ["PayPal", "BS", "USDT"];

const networkOptions = [
  { value: "BINANCE_PAY", label: "Binance Pay", img: "/images/binance_pay.png" },
  { value: "TRC20", label: "TRC20 (Tron)", img: "/images/trc20.png" },
  { value: "BEP20", label: "BNB Smart Chain (BEP20)", img: "/images/bep20.png" },
  { value: "ARBITRUM", label: "Arbitrum One", img: "/images/arbitrum.png" },
];

export default function AddPaymentMethodModal({ open, onClose, onSave }: any) {
  const [selectedTab, setSelectedTab] = useState("PayPal");
  const [form, setForm] = useState<any>({});

  const handleSave = () => {
    onSave(selectedTab, form);
    setForm({});
    toast.success("Cuenta guardada con éxito");
    onClose();
  };

  const renderBankSelect = () => {
    const selectedBank = bankOptions.find((b) => b.value === form.bankName);
    return (
      <Listbox
        value={form.bankName || ""}
        onChange={(value) => setForm({ ...form, bankName: value })}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-800 py-3 pl-12 pr-10 text-left border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base">
              {selectedBank ? (
                <>
                  <Image
                    src={selectedBank.img}
                    alt={selectedBank.label}
                    width={24}
                    height={24}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                  />
                  <span className="block truncate">{selectedBank.label}</span>
                </>
              ) : (
                <span className="text-gray-400">Selecciona un banco</span>
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </Listbox.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options className="absolute mt-1 max-h-[60vh] w-full overflow-auto rounded-xl bg-gray-800 border border-gray-700 py-1 text-sm sm:text-base text-white shadow-lg focus:outline-none z-50">
                {bankOptions.map((bank) => (
                  <Listbox.Option
                    key={bank.value}
                    value={bank.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-12 pr-10 ${
                        active ? "bg-green-500 text-white" : "text-gray-300"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <Image
                          src={bank.img}
                          alt={bank.label}
                          width={20}
                          height={20}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                        />
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {bank.label}
                        </span>
                        {selected && (
                          <Check className="absolute inset-y-0 right-2 my-auto h-4 w-4 text-white" />
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    );
  };

  const renderNetworkSelect = () => {
    const selectedNet = networkOptions.find((n) => n.value === form.network);
    return (
      <Listbox
        value={form.network || ""}
        onChange={(value) => setForm({ ...form, network: value })}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-800 py-3 pl-12 pr-10 text-left border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base">
              {selectedNet ? (
                <>
                  <Image
                    src={selectedNet.img}
                    alt={selectedNet.label}
                    width={24}
                    height={24}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                  />
                  <span className="block truncate">{selectedNet.label}</span>
                </>
              ) : (
                <span className="text-gray-400">Selecciona red</span>
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </Listbox.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options className="absolute mt-1 max-h-[60vh] w-full overflow-auto rounded-xl bg-gray-800 border border-gray-700 py-1 text-sm sm:text-base text-white shadow-lg focus:outline-none z-50">
                {networkOptions.map((net) => (
                  <Listbox.Option
                    key={net.value}
                    value={net.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-12 pr-10 ${
                        active ? "bg-green-500 text-white" : "text-gray-300"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <Image
                          src={net.img}
                          alt={net.label}
                          width={20}
                          height={20}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                        />
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {net.label}
                        </span>
                        {selected && (
                          <Check className="absolute inset-y-0 right-2 my-auto h-4 w-4 text-white" />
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    );
  };

  const renderForm = () => {
    switch (selectedTab) {
      case "PayPal":
        return (
          <input
            type="email"
            placeholder="Correo PayPal"
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={form.email || ""}
            onChange={(e) => setForm({ email: e.target.value })}
          />
        );

      case "BS":
        return (
          <div className="space-y-3">
            {renderBankSelect()}
            <input
              type="text"
              placeholder="Teléfono"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="text"
              placeholder="Cédula"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.idNumber || ""}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </div>
        );

      case "USDT":
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Dirección de Wallet"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            {renderNetworkSelect()}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex flex-col overflow-y-auto">
          <div className="flex-1 flex items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg mx-auto h-full sm:h-auto sm:rounded-2xl bg-gray-900 p-4 sm:p-6 shadow-xl transition-all border border-gray-700 flex flex-col">
                <Dialog.Title className="text-xl sm:text-2xl font-bold text-emerald-400 mb-4 text-center sm:text-left">
                  Agregar Método
                </Dialog.Title>

                {/* Tabs */}
                <Tab.Group
                  selectedIndex={tabs.indexOf(selectedTab)}
                  onChange={(index) => setSelectedTab(tabs[index])}
                >
                  <Tab.List className="flex space-x-2 mb-4">
                    {tabs.map((tab) => (
                      <Tab
                        key={tab}
                        className={({ selected }) =>
                          `flex-1 rounded-lg py-2 text-sm font-medium ${
                            selected
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-800 text-gray-400 hover:text-white"
                          }`
                        }
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels className="flex-1">
                    <Tab.Panel>{renderForm()}</Tab.Panel>
                    <Tab.Panel>{renderForm()}</Tab.Panel>
                    <Tab.Panel>{renderForm()}</Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                {/* Botones fijos en móviles */}
                <div className="mt-6 sm:mt-4 flex justify-end gap-3 sm:static fixed bottom-0 left-0 right-0 bg-gray-900 p-4 sm:bg-transparent border-t border-gray-700 sm:border-0">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-lg text-white font-semibold w-full sm:w-auto"
                  >
                    Guardar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
