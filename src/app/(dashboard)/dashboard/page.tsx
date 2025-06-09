"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const VerificationModal = dynamic(() => import("@/components/VerificationModal"), {
  ssr: false,
});

export default function DashboardPage() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return <div className="text-red-500">No autorizado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">
        Bienvenido, {user.firstName} 👋
      </h1>

      <p className="text-sm text-gray-400 mb-6">
        Para poder realizar operaciones, debes completar la verificación de identidad.
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-lg text-white font-semibold shadow-lg"
      >
        Verificar Identidad
      </button>

      <VerificationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
