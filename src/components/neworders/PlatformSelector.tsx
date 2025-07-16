"use client";

import { platformOptions } from "@/lib/platformOptions";
import Image from "next/image";
import { useOrderForm } from "@/context/OrderFormContext";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

export default function PlatformSelector() {
  const { selectedPlatform, setSelectedPlatform } = useOrderForm();

  const selectedOption = platformOptions.find(p => p.value === selectedPlatform);

  return (
    <div className="mt-6">
      <label className="text-sm text-gray-300 mb-2 block font-medium">Plataforma</label>

      <div className="relative w-full flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md px-4 py-2">
        {/* Ícono animado */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlatform}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Image
              src={selectedOption?.img || "/images/placeholder.png"}
              alt={`${selectedPlatform} icon`}
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {/* Select */}
        <div className="relative w-full flex-grow">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="appearance-none w-full bg-transparent text-white text-sm sm:text-base pr-10 py-2 focus:outline-none cursor-pointer"
          >
            {platformOptions.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label} {opt.disabled ? "(Próximamente)" : ""}
              </option>
            ))}
          </select>

          {/* Flecha personalizada */}
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white">
            <ChevronUpDownIcon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
