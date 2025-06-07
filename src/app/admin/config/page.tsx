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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        const data = await res.json();
        if (res.ok) setConfig(data);
        else console.error("Error cargando configuración:", data);
      } catch {
        console.error("Error al obtener configuración");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feePercent: config.feePercent,
          rate: config.rate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Configuración actualizada correctamente");
        setConfig(data);
      } else {
        setError(data.error || "Error al guardar cambios");
      }
    } catch {
      setError("Error de red al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-950 text-white">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Panel de Configuración</h1>

      {loading ? (
        <Loader2 className="animate-spin w-6 h-6" />
      ) : config ? (
        <div className="space-y-4 max-w-md">
          <label className="block">
            <span className="text-gray-300">Porcentaje de comisión (%)</span>
            <input
              type="number"
              value={config.feePercent}
              onChange={(e) =>
                setConfig({ ...config, feePercent: parseFloat(e.target.value) })
              }
              className="w-full mt-1 p-2 bg-gray-800 rounded border border-gray-600 text-white"
              min={0}
              step={0.01}
            />
          </label>

          <label className="block">
            <span className="text-gray-300">Tasa de cambio (rate)</span>
            <input
              type="number"
              value={config.rate}
              onChange={(e) =>
                setConfig({ ...config, rate: parseFloat(e.target.value) })
              }
              className="w-full mt-1 p-2 bg-gray-800 rounded border border-gray-600 text-white"
              min={0}
              step={0.0001}
            />
          </label>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-4 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}
          {success && <p className="text-green-500 mt-2">{success}</p>}
        </div>
      ) : (
        <p className="text-red-500">No se pudo cargar la configuración.</p>
      )}
    </div>
  );
}
