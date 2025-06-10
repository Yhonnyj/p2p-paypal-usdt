"use client";

import { useEffect, useState } from "react";

export default function VerificationStatusBadge() {
  const [status, setStatus] = useState<"NONE" | "PENDING" | "APPROVED" | "REJECTED" | "LOADING">("LOADING");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/verifications/status");
        const data = await res.json();

        if (res.ok) {
          setStatus(data.status);
        } else {
          setStatus("NONE");
        }
      } catch (_e) { // CAMBIO AQUÍ: 'e' a '_e'
        // Puedes logear el error aquí si necesitas debuggear, por ejemplo:
        // console.error("Error al obtener el estado de verificación:", _e);
        setStatus("NONE");
      }
    };

    fetchStatus();
  }, []);

  const getStatusLabel = () => {
    switch (status) {
      case "LOADING":
        return "Cargando...";
      case "NONE":
        return "🔵 No has enviado verificación";
      case "PENDING":
        return "🟡 Verificación pendiente";
      case "APPROVED":
        return "✅ Verificado";
      case "REJECTED":
        return "❌ Verificación rechazada";
      default:
        return "";
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow border border-gray-700">
      {getStatusLabel()}
    </div>
  );
}