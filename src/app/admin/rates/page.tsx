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

type AdminChannel = {
  id: string;
  key: string;
  label: string;
  commissionBuyPercent: number;
  commissionSellPercent: number;
  enabledBuy: boolean;
  enabledSell: boolean;
  visible: boolean;
  statusTextBuy: string | null;
  statusTextSell: string | null;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminDashboardPage() {
  // ---------- RATES ----------
  const [rates, setRates] = useState<Rate[]>([]);
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [newCurrency, setNewCurrency] = useState("");
  const [newRate, setNewRate] = useState(0);
  const [ratesSuccessMessage, setRatesSuccessMessage] = useState("");

  // ---------- CONFIG ----------
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSuccess, setConfigSuccess] = useState("");

  // ---------- PAYMENT CHANNELS (ADMIN) ----------
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [chEdit, setChEdit] = useState<Record<string, Partial<AdminChannel>>>({});
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [chMsg, setChMsg] = useState<string>("");

  // crear nuevo método
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPctBuy, setNewPctBuy] = useState<number>(0);
  const [newPctSell, setNewPctSell] = useState<number>(0);
  const [newEnabledBuy, setNewEnabledBuy] = useState(true);
  const [newEnabledSell, setNewEnabledSell] = useState(true);
  const [newVisible, setNewVisible] = useState(true);
  const [newSort, setNewSort] = useState<number>(0);

  // --------- Rates API ---------
  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/rates");
      const data = await res.json();
      if (res.ok) {
        setRates(data);
        const mapped: Record<string, number> = {};
        (data as Rate[]).forEach((r) => (mapped[r.id] = r.rate));
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
        setTimeout(() => setRatesSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error actualizando tasa", err);
    }
  };

  const handleDeleteRate = async (currency: string) => {
    try {
      const res = await fetch(`/api/admin/rates/${currency}`, { method: "DELETE" });
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
      ? ((editingRates[rate.id] - 1) * 100).toFixed(2)
      : editingRates[rate.id];
  };

  const handleRateInputChange = (id: string, value: string, isUsd: boolean) => {
    const parsed = parseFloat(value.replace(",", "."));
    if (!isNaN(parsed)) {
      setEditingRates((prev) => ({
        ...prev,
        [id]: isUsd ? 1 + parsed / 100 : parsed,
      }));
    }
  };

  // --------- Config API ---------
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
        setTimeout(() => setConfigSuccess(""), 3000);
      } else {
        setConfigError(data.error || "❌ Error al guardar cambios");
      }
    } catch {
      setConfigError("❌ Error de red al guardar configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  // --------- Payment Channels API ---------
  const fetchChannels = async () => {
    try {
      setLoadingChannels(true);
      const res = await fetch("/api/admin/payment-channels", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setChannels(data);
        const map: Record<string, Partial<AdminChannel>> = {};
        (data as AdminChannel[]).forEach((c) => {
          map[c.id] = {
            commissionBuyPercent: c.commissionBuyPercent,
            commissionSellPercent: c.commissionSellPercent,
            enabledBuy: c.enabledBuy,
            enabledSell: c.enabledSell,
            visible: c.visible,
            statusTextBuy: c.statusTextBuy,
            statusTextSell: c.statusTextSell,
            sortOrder: c.sortOrder,
          };
        });
        setChEdit(map);
      } else {
        setChMsg(data.error || "❌ Error cargando métodos");
      }
    } catch {
      setChMsg("❌ Error de red cargando métodos");
    } finally {
      setLoadingChannels(false);
    }
  };

  const createChannel = async () => {
    try {
      const res = await fetch("/api/admin/payment-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.toUpperCase().trim(),
          label: newLabel.trim(),
          commissionBuyPercent: Number(newPctBuy),
          commissionSellPercent: Number(newPctSell),
          enabledBuy: newEnabledBuy,
          enabledSell: newEnabledSell,
          visible: newVisible,
          sortOrder: Number(newSort),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChMsg("✅ Método creado");
        setNewKey(""); setNewLabel("");
        setNewPctBuy(0); setNewPctSell(0);
        setNewEnabledBuy(true); setNewEnabledSell(true);
        setNewVisible(true); setNewSort(0);
        fetchChannels();
      } else {
        setChMsg(data.error || "❌ Error al crear método");
      }
    } catch {
      setChMsg("❌ Error de red al crear método");
    } finally {
      setTimeout(() => setChMsg(""), 2500);
    }
  };

  const patchChannel = async (id: string, payload: Partial<AdminChannel>) => {
    try {
      const res = await fetch(`/api/admin/payment-channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setChMsg("✅ Guardado");
        fetchChannels();
      } else {
        setChMsg(data.error || "❌ Error guardando");
      }
    } catch {
      setChMsg("❌ Error de red guardando");
    } finally {
      setTimeout(() => setChMsg(""), 2000);
    }
  };

  const archiveChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payment-channels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setChMsg("🗂 Archivado");
        fetchChannels();
      } else {
        setChMsg(data.error || "❌ Error archivando");
      }
    } catch {
      setChMsg("❌ Error de red archivando");
    } finally {
      setTimeout(() => setChMsg(""), 2000);
    }
  };

  // --------- Initial Load ---------
  useEffect(() => {
    fetchRates();
    fetchConfig();
    fetchChannels();
  }, []);

  return (
    <div className="relative min-h-screen px-6 py-10 bg-gray-950 text-white overflow-hidden">
      {/* Fondo degradado animado */}
      <div
        className="absolute inset-0 z-0 opacity-10 animate-pulse-light pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
        }}
      />

      <h1 className="text-4xl font-bold mb-10 text-center text-green-400">
        🚀 Panel de Administración General
      </h1>

      {/* RATES */}
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
                step={rate.currency === "USD" ? 0.01 : 0.0001}
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
              placeholder="CÓDIGO (EJ: BS)"
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

      {/* CONFIG */}
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
            {configSuccess && (
              <p className="text-green-500 text-sm mt-2 text-center">{configSuccess}</p>
            )}
          </div>
        ) : (
          <p className="text-red-500 text-center">No se pudo cargar la configuración.</p>
        )}
      </div>

      {/* PAYMENT CHANNELS */}
      <div className="mt-14">
        <h2 className="text-3xl font-bold mb-6 text-green-400 border-b border-gray-700 pb-3">
          💳 Métodos de Pago (Payment Channels)
        </h2>

        {/* Crear nuevo */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-green-400 mb-4 font-semibold flex items-center gap-2">
            <PlusCircle size={18} /> Crear nuevo método
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="p-2 rounded bg-gray-800 border border-gray-600"
              placeholder="KEY (EJ: PAYPAL)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <input
              className="p-2 rounded bg-gray-800 border border-gray-600"
              placeholder="Label (EJ: PayPal)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600"
              placeholder="% Buy"
              value={newPctBuy}
              onChange={(e) => setNewPctBuy(Number(e.target.value))}
              min={0}
              step={0.01}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600"
              placeholder="% Sell"
              value={newPctSell}
              onChange={(e) => setNewPctSell(Number(e.target.value))}
              min={0}
              step={0.01}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600"
              placeholder="Sort"
              value={newSort}
              onChange={(e) => setNewSort(Number(e.target.value))}
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newEnabledBuy}
                  onChange={(e) => setNewEnabledBuy(e.target.checked)}
                />
                Buy
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newEnabledSell}
                  onChange={(e) => setNewEnabledSell(e.target.checked)}
                />
                Sell
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newVisible}
                  onChange={(e) => setNewVisible(e.target.checked)}
                />
                Visible
              </label>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={createChannel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              + Agregar método
            </button>
          </div>
        </div>

        {/* Lista / edición */}
        <div className="space-y-3">
          {loadingChannels ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="animate-spin w-8 h-8 text-white" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-gray-400">No hay métodos creados.</p>
          ) : (
            channels.map((c) => {
              const buf = chEdit[c.id] || {};
              return (
                <div
                  key={c.id}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4"
                >
                  <div className="w-full md:w-48">
                    <div className="font-bold">{c.label}</div>
                    <div className="text-xs text-gray-400">{c.key}</div>
                  </div>

                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full md:w-28 p-2 rounded bg-gray-800 border border-gray-600"
                    value={buf.commissionBuyPercent ?? c.commissionBuyPercent}
                    onChange={(e) =>
                      setChEdit((prev) => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], commissionBuyPercent: Number(e.target.value) },
                      }))
                    }
                    placeholder="% Buy"
                  />

                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full md:w-28 p-2 rounded bg-gray-800 border border-gray-600"
                    value={buf.commissionSellPercent ?? c.commissionSellPercent}
                    onChange={(e) =>
                      setChEdit((prev) => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], commissionSellPercent: Number(e.target.value) },
                      }))
                    }
                    placeholder="% Sell"
                  />

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(buf.enabledBuy ?? c.enabledBuy) as boolean}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], enabledBuy: e.target.checked },
                          }))
                        }
                      />
                      Buy
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(buf.enabledSell ?? c.enabledSell) as boolean}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], enabledSell: e.target.checked },
                          }))
                        }
                      />
                      Sell
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(buf.visible ?? c.visible) as boolean}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], visible: e.target.checked },
                          }))
                        }
                      />
                      Visible
                    </label>
                  </div>

                  <input
                    type="number"
                    className="w-full md:w-20 p-2 rounded bg-gray-800 border border-gray-600"
                    value={buf.sortOrder ?? c.sortOrder}
                    onChange={(e) =>
                      setChEdit((prev) => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], sortOrder: Number(e.target.value) },
                      }))
                    }
                    placeholder="Sort"
                  />

                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => patchChannel(c.id, chEdit[c.id] || {})}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2"
                    >
                      <Save size={16} /> Guardar
                    </button>
                    <button
                      onClick={() => archiveChannel(c.id)}
                      className="text-red-500 hover:text-red-700 px-3 py-2 rounded border border-red-500 hover:border-red-700 flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Archivar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {chMsg && <p className="text-center mt-4 text-sm text-green-400">{chMsg}</p>}
      </div>
    </div>
  );
}
