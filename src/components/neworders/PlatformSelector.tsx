"use client";

import { platformOptions } from "@/lib/platformOptions"; // Asegúrate de tener esto como helper separado
import Image from "next/image";
import { useOrderForm } from "@/context/OrderFormContext";

export default function PlatformSelector() {
  const { selectedPlatform, setSelectedPlatform } = useOrderForm();

  return (
    <div className="mt-6">
      <label className="text-sm text-gray-300 mb-2 block font-medium">Plataforma</label>
      <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
        <div className="p-2 flex items-center justify-center">
          <Image
            src={platformOptions.find(p => p.value === selectedPlatform)?.img || "/images/placeholder.png"}
            alt={`${selectedPlatform} icon`}
            width={40}
            height={40}
            className="rounded-full object-contain"
          />
        </div>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none cursor-pointer"
        >
          {platformOptions.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label} {opt.disabled ? "(Próximamente)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
