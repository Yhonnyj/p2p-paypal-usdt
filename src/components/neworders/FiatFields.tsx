"use client";

import { useEffect, useState, Fragment, forwardRef, useImperativeHandle } from "react";
import { useOrderForm } from "@/context/OrderFormContext";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import { bankOptions } from "@/lib/bankOptions";
import { toast } from "react-toastify";

interface PaymentMethod {
  id: string;
  type: string;
  details: {
    bankName?: string;
    phone?: string;
    idNumber?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

// --- Función para normalizar nombres de bancos ---
function normalizeBankName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^banco\s+/, "") // elimina prefijo "Banco "
    .replace(/\s|\(|\)|-/g, "");
}

const FiatFields = forwardRef((_, ref) => {
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

  const [accounts, setAccounts] = useState<PaymentMethod[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // --- Cargar cuentas ---
  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Error al cargar cuentas");
      const data: PaymentMethod[] = await res.json();
      const fiatAccounts = data.filter((m) => m.type === "BS" || m.type === "COP");
      setAccounts(fiatAccounts);

      if (selectedDestinationCurrency === "BS") {
        const bsAccounts = fiatAccounts.filter((m) => m.type === "BS");
        if (bsAccounts.length > 0 && !isAddingNew) {
          const first = bsAccounts[0];
          setSelectedAccountId(first.id);
          setBankName(first.details.bankName || "");
          setBsPhoneNumber(first.details.phone || "");
          setBsIdNumber(first.details.idNumber || "");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron cargar las cuentas.");
    }
  };

  useEffect(() => {
    if (selectedDestinationCurrency === "BS" || selectedDestinationCurrency === "COP") {
      fetchAccounts();
    }
  }, [selectedDestinationCurrency]);

  // --- Guardar cuenta en API (solo cuando se llame desde "Continuar") ---
  const handleSaveAccount = async () => {
    try {
      // --- Validar BS ---
      if (
        selectedDestinationCurrency === "BS" &&
        bankName &&
        bsPhoneNumber &&
        bsIdNumber
      ) {
        // Evitar duplicados
        const exists = accounts.some(
          (acc) =>
            acc.type === "BS" &&
            normalizeBankName(acc.details.bankName || "") === normalizeBankName(bankName) &&
            acc.details.phone === bsPhoneNumber &&
            acc.details.idNumber === bsIdNumber
        );

        if (exists) {
toast.success("Estamos procesando tu orden.");
          return;
        }

        const selectedBankOption = bankOptions.find(
          (b) =>
            normalizeBankName(b.value) === normalizeBankName(bankName) ||
            normalizeBankName(b.label) === normalizeBankName(bankName)
        );

        const bankValue = selectedBankOption ? selectedBankOption.value : bankName;

        const res = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "BS",
            details: { bankName: bankValue, phone: bsPhoneNumber, idNumber: bsIdNumber },
          }),
        });

        if (!res.ok) throw new Error("Error al guardar cuenta");
        toast.success("Cuenta BS guardada con la orden.");
        setIsAddingNew(false);
        await fetchAccounts();
      }

      // --- Validar COP ---
      if (
        selectedDestinationCurrency === "COP" &&
        copAccountNumber &&
        copAccountHolder
      ) {
        const existsCOP = accounts.some(
          (acc) =>
            acc.type === "COP" &&
            acc.details.accountNumber === copAccountNumber &&
            acc.details.accountHolder?.toLowerCase() === copAccountHolder.toLowerCase()
        );

        if (existsCOP) {
toast.success("Estamos procesando tu orden.");
          return;
        }

        const res = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "COP",
            details: { accountNumber: copAccountNumber, accountHolder: copAccountHolder },
          }),
        });

        if (!res.ok) throw new Error("Error al guardar cuenta COP");
        toast.success("Cuenta COP guardada con la orden.");
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la cuenta.");
    }
  };

  // Exponer método para que "Continuar" pueda llamar handleSaveAccount()
  useImperativeHandle(ref, () => ({
    saveFiatAccount: handleSaveAccount,
  }));

  if (selectedDestinationCurrency === "USDT") return null;

  const selectedBank = bankOptions.find(
    (b) => normalizeBankName(b.value) === normalizeBankName(bankName)
  );

  return (
  <div className="mt-6 w-full space-y-6">
    {selectedDestinationCurrency === "BS" &&
      accounts.filter(a => a.type === "BS").length > 0 &&
      !isAddingNew ? (
      <>
        {(showAll
          ? accounts.filter(a => a.type === "BS")
          : accounts.filter(a => a.type === "BS").slice(0, 2)
        ).map((account) => {
          const accountBank = bankOptions.find(
            (b) =>
              normalizeBankName(b.value) ===
              normalizeBankName(account.details.bankName || "")
          );
          const isSelected = account.id === selectedAccountId;
          const isDisabled = accountBank?.disabled;

          return (
            <div
              key={account.id}
              onClick={() => {
                if (isDisabled) return;
                setSelectedAccountId(account.id);
                setBankName(account.details.bankName || "");
                setBsPhoneNumber(account.details.phone || "");
                setBsIdNumber(account.details.idNumber || "");
              }}
              className={`relative w-full rounded-xl p-4 shadow-md transition border 
                ${isDisabled
                  ? "border-red-500 bg-gray-800 opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-emerald-500 bg-gray-700 cursor-pointer"
                  : "border-gray-700 bg-gray-800 hover:border-emerald-500 cursor-pointer"
                }`}
            >
              <div className="flex items-center gap-3">
                {accountBank && (
                  <Image
                    src={accountBank.img}
                    alt={accountBank.label}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-white text-sm">
                    {accountBank ? accountBank.label : account.details.bankName}
                  </p>
                  <p className="text-gray-400 text-xs">Tel: {account.details.phone}</p>
                  <p className="text-gray-400 text-xs">CI: {account.details.idNumber}</p>
                  {isDisabled && (
                    <p className="text-xs text-red-400 mt-1">
                      Banco está presentando problemas, por favor seleccionar otro banco.
                    </p>
                  )}
                </div>
                {!isDisabled && isSelected && (
                  <Check className="h-5 w-5 text-emerald-400" />
                )}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between items-center mt-2">
          {accounts.filter(a => a.type === "BS").length > 2 && (
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
              setBankName("");
              setBsPhoneNumber("");
              setBsIdNumber("");
              setSelectedAccountId(null);
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
          {/* Selector de banco (BS) o input (COP) */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">
              Nombre del Banco
            </label>
            {selectedDestinationCurrency === "BS" ? (
              <Listbox value={bankName} onChange={setBankName}>
                {({ open }) => (
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 py-3 pl-12 pr-10 text-left border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base">
                      {selectedBank ? (
                        <>
                          <Image
                            src={selectedBank.img}
                            alt={selectedBank.label}
                            width={24}
                            height={24}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                          />
                          <span className="block truncate">
                            {selectedBank.label}
                          </span>
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
                      <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-gray-800 border border-gray-700 py-1 text-sm sm:text-base text-white shadow-lg focus:outline-none z-50">
  {bankOptions.map((bank) => (
    <Listbox.Option
      key={bank.value}
      value={bank.value}
      disabled={bank.disabled} // 👈 evitar selección si está deshabilitado
      className={({ active, disabled }) =>
        `relative select-none py-2 pl-12 pr-10 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : active
            ? "bg-green-500 text-white cursor-pointer"
            : "text-gray-300 cursor-pointer"
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
          {bank.note && (
            <span className="block text-xs text-red-400">{bank.note}</span>
          )}
          {selected && !bank.disabled && (
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
            ) : (
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: Bancolombia"
                className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
              />
            )}
          </div>

          {/* Campos adicionales para BS */}
          {selectedDestinationCurrency === "BS" && (
            <>
              <div>
                <label className="text-sm text-gray-300 mb-2 block font-medium leading-6">
                  Número de Teléfono (BS)
                </label>
                <input
                  type="text"
                  value={bsPhoneNumber}
                  onChange={(e) => setBsPhoneNumber(e.target.value)}
                  placeholder="Ej: 0412-1234567"
                  className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block font-medium leading-6">
                  Cédula de Identidad (BS)
                </label>
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
        </>
      )}

      {/* Campos adicionales para COP */}
      {selectedDestinationCurrency === "COP" && (
        <>
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-medium leading-6">
              Número de Cuenta (COP)
            </label>
            <input
              type="text"
              value={copAccountNumber}
              onChange={(e) => setCopAccountNumber(e.target.value)}
              placeholder="Ej: 12345678901"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-medium leading-6">
              Nombre del Titular
            </label>
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
});

FiatFields.displayName = "FiatFields";

export default FiatFields;
