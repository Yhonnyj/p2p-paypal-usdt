"use client";

import { useEffect, useState, Fragment } from "react";
import { useOrderForm } from "@/context/OrderFormContext";
import Image from "next/image";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface PaymentMethod {
  id: string;
  type: string;
  details: { email?: string };
}

export default function PaypalAccountSelector() {
  const { paypalEmail, setPaypalEmail } = useOrderForm();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Cargar cuentas guardadas
  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Error al cargar cuentas guardadas");
      const data: PaymentMethod[] = await res.json();
      const paypalAccounts = data.filter((m) => m.type === "PayPal");
      setMethods(paypalAccounts);

      // Seleccionar automáticamente la primera cuenta guardada
      if (paypalAccounts.length > 0 && !paypalEmail && !isAddingNew) {
        setPaypalEmail(paypalAccounts[0].details.email || "");
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron cargar las cuentas guardadas.");
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // Guardar automáticamente una nueva cuenta si no existe
  const saveAccountIfNew = async (email: string) => {
    const alreadyExists = methods.some((m) => m.details.email === email);
    if (!alreadyExists && email) {
      try {
        const res = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "PayPal", details: { email } }),
        });
        if (!res.ok) throw new Error("Error al guardar nueva cuenta");
        toast.success("Cuenta PayPal guardada automáticamente.");
        await fetchMethods();
      } catch (err) {
        console.error(err);
        toast.error("No se pudo guardar la cuenta automáticamente.");
      }
    }
  };

  // Manejo de selección en Listbox
  const handleSelect = (value: string) => {
    if (value === "new") {
      setPaypalEmail("");
      setIsAddingNew(true);
    } else {
      setPaypalEmail(value);
      setIsAddingNew(false);
    }
  };

  // Guardar automáticamente si es una nueva cuenta
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (paypalEmail && isAddingNew) {
        saveAccountIfNew(paypalEmail);
      }
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [paypalEmail]);

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-300 block font-medium">
        Correo de PayPal
      </label>

      {/* Si no hay cuentas guardadas o está agregando nueva */}
      {methods.length === 0 || isAddingNew ? (
        <div className="relative flex items-center">
          <Image
            src="/images/paypal.png"
            alt="PayPal"
            width={24}
            height={24}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
          />
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="cliente@paypal.com"
            className="w-full pl-12 pr-24 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
          />
          {methods.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="absolute right-3 text-sm sm:text-base text-emerald-400 hover:text-emerald-300"
            >
              Ver cuentas
            </button>
          )}
        </div>
      ) : (
        <div className="relative flex items-center">
          {/* Botón principal que muestra la cuenta actual */}
          <Listbox value={paypalEmail} onChange={handleSelect}>
            {({ open }) => (
              <div className="relative w-full">
                <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 py-3 pl-12 pr-24 text-left border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base">
                  <Image
                    src="/images/paypal.png"
                    alt="PayPal"
                    width={24}
                    height={24}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                  />
                  <span className="block truncate">
                    {paypalEmail || "Selecciona una cuenta"}
                  </span>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </Listbox.Button>

                {/* Opciones con animación */}
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
                    {methods.map((m) => (
                      <Listbox.Option
                        key={m.id}
                        value={m.details.email}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-12 pr-10 ${
                            active
                              ? "bg-emerald-500 text-white"
                              : "text-gray-300"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <Image
                              src="/images/paypal.png"
                              alt="PayPal"
                              width={20}
                              height={20}
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                            />
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {m.details.email}
                            </span>
                            {selected && (
                              <Check className="absolute inset-y-0 right-2 my-auto h-4 w-4 text-white" />
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                    <Listbox.Option
                      value="new"
                      className="relative cursor-pointer select-none py-2 pl-12 pr-10 text-gray-300 hover:bg-emerald-500 hover:text-white"
                    >
                      + Agregar nueva cuenta
                    </Listbox.Option>
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>

          {/* Botón para agregar nueva cuenta */}
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setPaypalEmail("");
            }}
            className="absolute right-3 text-sm sm:text-base text-emerald-400 hover:text-emerald-300"
          >
            Agregar nueva
          </button>
        </div>
      )}
    </div>
  );
}
