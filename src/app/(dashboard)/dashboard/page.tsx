"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import VerificationStatusBadge from "@/components/VerificationStatusBadge";

const VerificationModal = dynamic(() => import("@/components/VerificationModal"), {
  ssr: false,
});

type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "LOADING";

export default function DashboardPage() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("LOADING");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/verifications/status");
        const data = await res.json();
        if (res.ok) {
          setVerificationStatus(data.status);
        } else {
          setVerificationStatus("NONE");
        }
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Aquí no debe haber ningún texto extra como '<--- CHANGE HERE'
        setVerificationStatus("NONE");
      }
    };

    fetchStatus();
  }, []);

  if (!user) {
    return <div className="text-red-500">No autorizado</div>;
  }

  return (
    <div className="relative min-h-screen bg-gray-950 text-white p-8">
      <VerificationStatusBadge />

      <h1 className="text-2xl font-bold mb-4">
        Bienvenido, {user.firstName} 👋
      </h1>

      <p className="text-sm text-gray-400 mb-6">
        Para poder realizar operaciones, debes completar la verificación de identidad.
      </p>

      {(verificationStatus === "NONE" || verificationStatus === "REJECTED") && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-lg text-white font-semibold shadow-lg"
        >
          Verificar Identidad
        </button>
      )}

      <VerificationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}