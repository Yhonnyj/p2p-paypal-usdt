"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface VerificationItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string;
  selfieUrl: string;
  user: {
    email: string;
    fullName: string | null;
  } | null;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    const res = await fetch("/api/admin/verifications");
    const data = await res.json();
    setVerifications(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    await fetch(`/api/admin/verifications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchVerifications(); // Refresca la lista
  };

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 3000); // Actualiza cada 3s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="p-4 text-white">Cargando verificaciones...</p>;

  return (
    <div className="p-8 bg-gray-950 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Panel de Verificaciones</h1>
      {verifications.length === 0 ? (
        <p className="text-gray-400">No hay verificaciones enviadas.</p>
      ) : (
        <div className="grid gap-6">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="border border-gray-700 rounded-xl p-4 bg-gray-900"
            >
              <p className="text-sm text-gray-400 mb-2">
                Usuario:{" "}
                <span className="text-white font-semibold">
                  {v.user?.fullName || "Sin nombre"}
                </span>{" "}
                ({v.user?.email})
              </p>
              <div className="flex gap-4 mb-4">
                <Image
                  src={v.documentUrl}
                  alt="Documento"
                  width={200}
                  height={150}
                  className="rounded-lg border border-gray-700"
                />
                <Image
                  src={v.selfieUrl}
                  alt="Selfie"
                  width={200}
                  height={150}
                  className="rounded-lg border border-gray-700"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">
                  Estado: {v.status}
                </span>
                <button
                  onClick={() => updateStatus(v.id, "APPROVED")}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => updateStatus(v.id, "REJECTED")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
