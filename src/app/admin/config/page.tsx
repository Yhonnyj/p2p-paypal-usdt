// app/admin/config/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type AppConfig = {
  id: number;
  feePercent: number;
  rate: number;
};

export default function AdminConfigPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        const data = await res.json();
        if (res.ok) setConfig(data);
        else console.error(data);
      } catch (err) {
        console.error("Error al obtener configuración:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-950 text-white">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Panel de Configuración</h1>

      {loading ? (
        <Loader2 className="animate-spin w-6 h-6" />
      ) : config ? (
        <div className="space-y-4">
          <p>
            <strong>Porcentaje de comisión:</strong> {config.feePercent}%
          </p>
          <p>
            <strong>Rate:</strong> {config.rate}
          </p>
        </div>
      ) : (
        <p className="text-red-500">No se pudo cargar la configuración.</p>
      )}
    </div>
  );
}
