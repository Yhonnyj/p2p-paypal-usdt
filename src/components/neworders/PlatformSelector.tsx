"use client";

import { Fragment, useMemo } from "react";
import Image from "next/image";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useOrderForm } from "@/context/OrderFormContext";

// Intenta resolver un icono por key (PAYPAL -> /images/paypal.png)
function getIconForKey(key?: string) {
  if (!key) return "/images/placeholder.png";
  return `/images/${key.toLowerCase()}.png`;
}

export default function PlatformSelector() {
  const {
    channels,                // [{ key, label, available, displayStatus, sortOrder, commissionPercent }]
    selectedChannelKey,      // "PAYPAL" | null
    setSelectedChannelKey,
    // legacy visual: seguimos manteniéndolo sincronizado
    selectedPlatform,
    setSelectedPlatform,
  } = useOrderForm();

  // Ordena por sortOrder (prioridad definida en el admin)
  const sorted = useMemo(
    () => [...channels].sort((a, b) => a.sortOrder - b.sortOrder),
    [channels]
  );

  // Selección efectiva: el actual; si no, el primer "available"; si no, null
  const selected =
    sorted.find((c) => c.key === selectedChannelKey) ??
    sorted.find((c) => c.available) ??
    null;

  const effectiveLabel = selected?.label ?? selectedPlatform ?? "Selecciona";

  const handleChange = (key: string) => {
    const ch = sorted.find((c) => c.key === key);
    setSelectedChannelKey(key);
    if (ch) setSelectedPlatform(ch.label); // sincroniza tu label (UI actual)
  };

  return (
    <div className="mt-6 w-full">
      <label className="text-sm text-gray-300 mb-2 block font-medium">Plataforma</label>

      {/* Esqueleto cuando aún no hay datos */}
      {sorted.length === 0 ? (
        <div className="h-11 rounded-xl bg-gray-800/60 border border-gray-700 animate-pulse" />
      ) : (
        <Listbox value={selected?.key ?? ""} onChange={handleChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 border border-gray-700 py-2 pl-3 pr-10 text-left shadow-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span className="flex items-center gap-3">
                <Image
                  src={getIconForKey(selected?.key)}
                  alt={`${effectiveLabel} icon`}
                  width={40}
                  height={40}
                  className="h-7 w-7 rounded-full object-contain"
                />
                <span className="block truncate text-base">{effectiveLabel}</span>
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
                {sorted.map((p) => (
                  <Listbox.Option
                    key={p.key}
                    value={p.key}
                    disabled={!p.available}
                    className={({ active, disabled }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-emerald-700 text-white" : "text-gray-200"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`
                    }
                    aria-disabled={!p.available}
                  >
                    <span className="flex items-center gap-3">
                      <Image
                        src={getIconForKey(p.key)}
                        alt={`${p.label} icon`}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-contain"
                      />
                      <span className="block truncate text-sm">
                        {p.label} {!p.available ? "(No disponible)" : ""}
                      </span>
                    </span>
                    {/* Estado/nota definida en admin */}
                    {p.displayStatus && (
                      <div className="pl-10 pr-4 text-[11px] text-gray-400">
                        {p.displayStatus}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      )}
    </div>
  );
}
