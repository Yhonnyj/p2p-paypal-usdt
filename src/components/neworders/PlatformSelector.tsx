"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { platformOptions } from "@/lib/platformOptions";
import { useOrderForm } from "@/context/OrderFormContext";

export default function PlatformSelector() {
  const { selectedPlatform, setSelectedPlatform } = useOrderForm();

  const selected = platformOptions.find((p) => p.value === selectedPlatform);

  return (
    <div className="mt-6 w-full">
      <label className="text-sm text-gray-300 mb-2 block font-medium">Plataforma</label>

      <Listbox value={selectedPlatform} onChange={setSelectedPlatform}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-800 border border-gray-700 py-2 pl-3 pr-10 text-left shadow-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <span className="flex items-center gap-3">
              <Image
                src={selected?.img || "/images/placeholder.png"}
                alt={`${selected?.label} icon`}
                width={40}
                height={40}
                className="h-7 w-7 rounded-full object-contain"
              />
              <span className="block truncate text-base">{selected?.label || selectedPlatform}</span>
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
              {platformOptions.map((platform) => (
                <Listbox.Option
                  key={platform.value}
                  value={platform.value}
                  disabled={platform.disabled}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? "bg-emerald-700 text-white" : "text-gray-200"
                    } ${platform.disabled ? "opacity-50 cursor-not-allowed" : ""}`
                  }
                >
                  <span className="flex items-center gap-3">
                    <Image
                      src={platform.img}
                      alt={`${platform.label} icon`}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-contain"
                    />
                    <span className="block truncate text-sm">
                      {platform.label} {platform.disabled ? "(Próximamente)" : ""}
                    </span>
                  </span>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
