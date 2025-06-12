"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type AppConfig = {
  id: number;
  feePercent: number;
  rate: number;
  bsRate: number;
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
        else setError(data.error || "Error al cargar configuración");
      } catch {
        setError("Error de red al obtener configuración");
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
          bsRate: config.bsRate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Configuración actualizada correctamente");
        setConfig(data);
      } else {
        setError(data.error || "❌ Error al guardar cambios");
      }
    } catch {
      setError("❌ Error de red al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-950 text-white">
      <h1 className="text-3xl font-bold mb-6 text-green-400">
        🛠 Panel de Configuración del Sistema
      </h1>

      {loading ? (
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      ) : config ? (
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Porcentaje de comisión (%) 🔧
            </label>
            <input
              type="number"
              value={config.feePercent}
              onChange={(e) =>
                setConfig({ ...config, feePercent: parseFloat(e.target.value) })
              }
              className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white"
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Tasa USDT → USD 💵
            </label>
            <input
              type="number"
              value={config.rate}
              onChange={(e) =>
                setConfig({ ...config, rate: parseFloat(e.target.value) })
              }
              className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white"
              min={0}
              step={0.0001}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Tasa USDT → BS 🇻🇪
            </label>
            <input
              type="number"
              value={config.bsRate}
              onChange={(e) =>
                setConfig({ ...config, bsRate: parseFloat(e.target.value) })
              }
              className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white"
              min={0}
              step={0.01}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
        </div>
      ) : (
        <p className="text-red-500">No se pudo cargar la configuración.</p>
      )}
    </div>
  );
}
