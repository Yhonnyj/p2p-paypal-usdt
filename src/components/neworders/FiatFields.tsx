"use client";

import { useOrderForm } from "@/context/OrderFormContext";

export default function FiatFields() {
  const {
    selectedDestinationCurrency,
    bankName,
    setBankName,
    bsPhoneNumber,
    setBsPhoneNumber,
    bsIdNumber,
    setBsIdNumber,
    copAccountNumber,
    setCopAccountNumber,
    copAccountHolder,
    setCopAccountHolder,
  } = useOrderForm();

  if (selectedDestinationCurrency === "USDT") return null;

  return (
    <div className="mt-6 w-full space-y-6">
      <div>
        <label className="text-sm text-gray-300 mb-1 block font-medium">Nombre del Banco</label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Ej: Bancolombia"
          className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
        />
      </div>

      {selectedDestinationCurrency === "BS" && (
        <>
          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Número de Teléfono (BS)</label>
            <input
              type="text"
              value={bsPhoneNumber}
              onChange={(e) => setBsPhoneNumber(e.target.value)}
              placeholder="Ej: 0412-1234567"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Cédula de Identidad (BS)</label>
            <input
              type="text"
              value={bsIdNumber}
              onChange={(e) => setBsIdNumber(e.target.value)}
              placeholder="Ej: V-12345678"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>
        </>
      )}

      {selectedDestinationCurrency === "COP" && (
        <>
          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Número de Cuenta (COP)</label>
            <input
              type="text"
              value={copAccountNumber}
              onChange={(e) => setCopAccountNumber(e.target.value)}
              placeholder="Ej: 12345678901"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Nombre del Titular</label>
            <input
              type="text"
              value={copAccountHolder}
              onChange={(e) => setCopAccountHolder(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>
        </>
      )}
    </div>
  );
}
