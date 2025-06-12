"use client";

import { useEffect, useState } from "react";
import { Trash2, Save, PlusCircle, Loader2 } from "lucide-react";

interface Rate {
  id: string;
  currency: string;
  rate: number;
}

type AppConfig = {
  id: number;
  feePercent: number;
  rate: number;
  bsRate: number;
};

export default function AdminDashboardPage() {
  // State for Rates management
  const [rates, setRates] = useState<Rate[]>([]);
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [newCurrency, setNewCurrency] = useState("");
  const [newRate, setNewRate] = useState(0);
  const [ratesSuccessMessage, setRatesSuccessMessage] = useState("");

  // State for Config management
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSuccess, setConfigSuccess] = useState("");

  // --- Rates Management Functions ---

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/rates");
      const data = await res.json();
      if (res.ok) {
        setRates(data);
        const mapped: Record<string, number> = {};
        data.forEach((r: Rate) => {
          mapped[r.id] = r.rate;
        });
        setEditingRates(mapped);
      }
    } catch (error) {
      console.error("Error cargando tasas", error);
    }
  };

  const handleSaveRate = async (rate: Rate) => {
    try {
      const res = await fetch(`/api/admin/rates/${rate.currency}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: editingRates[rate.id] }),
      });
      if (res.ok) {
        setRatesSuccessMessage("✅ Tasa actualizada correctamente");
        fetchRates();
        setTimeout(() => setRatesSuccessMessage(""), 3000); // Clear message after 3 seconds
      }
    } catch (err) {
      console.error("Error actualizando tasa", err);
    }
  };

  const handleDeleteRate = async (currency: string) => {
    try {
      const res = await fetch(`/api/admin/rates/${currency}`, {
        method: "DELETE",
      });
      if (res.ok) fetchRates();
    } catch (err) {
      console.error("Error eliminando moneda", err);
    }
  };

  const handleAddRate = async () => {
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency.toUpperCase(), rate: newRate }),
      });
      if (res.ok) {
        setNewCurrency("");
        setNewRate(0);
        fetchRates();
      }
    } catch (err) {
      console.error("Error agregando moneda", err);
    }
  };

  const getDisplayValue = (rate: Rate) => {
    return rate.currency === "USD"
      ? ((editingRates[rate.id] - 1) * 100).toFixed(2) // Display as percentage for USD
      : editingRates[rate.id];
  };

  const handleRateInputChange = (id: string, value: string, isUsd: boolean) => {
    const parsed = parseFloat(value.replace(",", "."));
    if (!isNaN(parsed)) {
      setEditingRates({
        ...editingRates,
        [id]: isUsd ? 1 + parsed / 100 : parsed,
      });
    }
  };

  // --- Config Management Functions ---

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      if (res.ok) setConfig(data);
      else setConfigError(data.error || "Error al cargar configuración");
    } catch {
      setConfigError("Error de red al obtener configuración");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSavingConfig(true);
    setConfigError("");
    setConfigSuccess("");

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
        setConfigSuccess("✅ Configuración actualizada correctamente");
        setConfig(data);
        setTimeout(() => setConfigSuccess(""), 3000); // Clear message after 3 seconds
      } else {
        setConfigError(data.error || "❌ Error al guardar cambios");
      }
    } catch {
      setConfigError("❌ Error de red al guardar configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  // --- Initial Data Fetch on Mount ---
  useEffect(() => {
    fetchRates();
    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-10 text-center text-green-400">
        🚀 Panel de Administración General
      </h1>

      {/* Rates Management Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-green-400 border-b border-gray-700 pb-3">
          💱 Gestión de Tasas de Cambio
        </h2>

        <div className="space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="font-bold text-lg w-full md:w-20 text-center md:text-left">
                {rate.currency}
              </div>

              <input
                type="number"
                value={getDisplayValue(rate)}
                onChange={(e) =>
                  handleRateInputChange(rate.id, e.target.value, rate.currency === "USD")
                }
                className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white w-full"
                step={rate.currency === "USD" ? 0.01 : 0.0001} // Adjust step based on currency
              />

              <div className="flex gap-2 w-full md:w-auto justify-center">
                <button
                  onClick={() => handleSaveRate(rate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 flex-grow md:flex-none"
                >
                  <Save size={16} /> Guardar
                </button>

                <button
                  onClick={() => handleDeleteRate(rate.currency)}
                  className="text-red-500 hover:text-red-700 px-4 py-2 rounded border border-red-500 hover:border-red-700 flex items-center gap-2 flex-grow md:flex-none justify-center"
                >
                  <Trash2 size={18} /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6">
          <h3 className="text-green-400 mb-4 font-semibold flex items-center gap-2">
            <PlusCircle size={18} /> Agregar nueva moneda
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="text"
              placeholder="CÓDIGO (EJ: AR)"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full md:w-32 p-2 rounded bg-gray-800 border border-gray-600 text-white"
            />
            <input
              type="number"
              placeholder="0"
              value={newRate}
              onChange={(e) => setNewRate(Number(e.target.value))}
              className="w-full md:w-32 p-2 rounded bg-gray-800 border border-gray-600 text-white"
              step={0.01}
            />
            <button
              onClick={handleAddRate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full md:w-auto"
            >
              + Agregar
            </button>
          </div>
        </div>

        {ratesSuccessMessage && (
          <p className="text-green-400 mt-4 text-center">{ratesSuccessMessage}</p>
        )}
      </div>

      {/* System Configuration Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-green-400 border-b border-gray-700 pb-3">
          🛠 Configuración del Sistema
        </h2>

        {loadingConfig ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-white" />
          </div>
        ) : config ? (
          <div className="space-y-6 max-w-md mx-auto">
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

        

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            >
              {savingConfig ? "Guardando..." : "Guardar Cambios"}
            </button>

            {configError && <p className="text-red-500 text-sm mt-2 text-center">{configError}</p>}
            {configSuccess && <p className="text-green-500 text-sm mt-2 text-center">{configSuccess}</p>}
          </div>
        ) : (
          <p className="text-red-500 text-center">No se pudo cargar la configuración.</p>
        )}
      </div>
    </div>
  );
}