"use client";

import { useEffect, useState } from "react";
import { Trash2, Save, PlusCircle, Loader2 } from "lucide-react";

interface Rate {
  id: string;
  currency: string;
  rate: number;
}

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

  // ---------- PAYMENT CHANNELS ----------
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

  const getDisplayValue = (rate: Rate) =>
    rate.currency === "USD"
      ? ((editingRates[rate.id] - 1) * 100).toFixed(2)
      : editingRates[rate.id];

  const handleRateInputChange = (id: string, value: string, isUsd: boolean) => {
    const parsed = parseFloat(value.replace(",", "."));
    if (!isNaN(parsed)) {
      setEditingRates((prev) => ({
        ...prev,
        [id]: isUsd ? 1 + parsed / 100 : parsed,
      }));
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

  // 🔥 Borrar DEFINITIVAMENTE el método
  const deleteChannel = async (id: string, label: string) => {
    const ok = window.confirm(`¿Borrar el método "${label}" de forma permanente?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/payment-channels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setChMsg("🗑️ Método borrado");
        fetchChannels();
      } else {
        setChMsg(data.error || "❌ Error al borrar");
      }
    } catch {
      setChMsg("❌ Error de red al borrar");
    } finally {
      setTimeout(() => setChMsg(""), 2000);
    }
  };

  // --------- Initial Load ---------
  useEffect(() => {
    fetchRates();
    fetchChannels();
  }, []);

  return (
    <div className="relative min-h-screen px-4 sm:px-6 py-6 sm:py-10 bg-gray-950 text-white overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 opacity-10 animate-pulse-light pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}
      />

      <h1 className="text-2xl sm:text-4xl font-extrabold mb-6 sm:mb-10 text-center text-green-400">
        🚀 Panel de Administración
      </h1>

      {/* RATES */}
      <section className="mb-10 sm:mb-12">
        <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-green-400 border-b border-gray-700 pb-2 sm:pb-3">
          💱 Gestión de Tasas de Cambio
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-base sm:text-lg">{rate.currency}</div>
                <div className="text-xs text-gray-400">
                  {rate.currency === "USD" ? "Δ% sobre 1.00" : "Tasa congelada"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
                <input
                  type="number"
                  value={getDisplayValue(rate)}
                  onChange={(e) =>
                    handleRateInputChange(rate.id, e.target.value, rate.currency === "USD")
                  }
                  className="p-2 rounded bg-gray-800 border border-gray-600 text-white w-full"
                  step={rate.currency === "USD" ? 0.01 : 0.0001}
                />

                <button
                  onClick={() => handleSaveRate(rate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Guardar
                </button>

                <button
                  onClick={() => handleDeleteRate(rate.currency)}
                  className="text-red-500 hover:text-red-700 px-4 py-2 rounded border border-red-500 hover:border-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-700 pt-4 sm:pt-6">
          <h3 className="text-green-400 mb-3 sm:mb-4 font-semibold flex items-center gap-2">
            <PlusCircle size={18} /> Agregar nueva moneda
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_140px_auto] gap-3">
            <input
              type="text"
              placeholder="CÓDIGO (EJ: BS)"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
            />
            <input
              type="number"
              placeholder="0"
              value={newRate}
              onChange={(e) => setNewRate(Number(e.target.value))}
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
              step={0.01}
            />
            <button
              onClick={handleAddRate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              + Agregar
            </button>
          </div>
        </div>

        {ratesSuccessMessage && (
          <p className="text-green-400 mt-4 text-center text-sm">{ratesSuccessMessage}</p>
        )}
      </section>

      {/* PAYMENT CHANNELS */}
      <section className="mt-10 sm:mt-14">
        <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-green-400 border-b border-gray-700 pb-2 sm:pb-3">
          💳 Métodos de Pago (Payment Channels)
        </h2>

        {/* Crear nuevo */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-5 mb-6">
          <h3 className="text-green-400 mb-3 sm:mb-4 font-semibold flex items-center gap-2">
            <PlusCircle size={18} /> Crear nuevo método
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input
              className="p-2 rounded bg-gray-800 border border-gray-600 w-full"
              placeholder="KEY (EJ: PAYPAL)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <input
              className="p-2 rounded bg-gray-800 border border-gray-600 w-full"
              placeholder="Label (EJ: PayPal)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600 w-full"
              placeholder="% Buy"
              value={newPctBuy}
              onChange={(e) => setNewPctBuy(Number(e.target.value))}
              min={0}
              step={0.01}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600 w-full"
              placeholder="% Sell"
              value={newPctSell}
              onChange={(e) => setNewPctSell(Number(e.target.value))}
              min={0}
              step={0.01}
            />
            <input
              type="number"
              className="p-2 rounded bg-gray-800 border border-gray-600 w-full"
              placeholder="Sort"
              value={newSort}
              onChange={(e) => setNewSort(Number(e.target.value))}
            />
            <div className="flex items-center gap-4 p-2 rounded bg-gray-800 border border-gray-600">
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
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
                  className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{c.label}</div>
                      <div className="text-xs text-gray-400">{c.key}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-600"
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
                      className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                      value={buf.commissionSellPercent ?? c.commissionSellPercent}
                      onChange={(e) =>
                        setChEdit((prev) => ({
                          ...prev,
                          [c.id]: { ...prev[c.id], commissionSellPercent: Number(e.target.value) },
                        }))
                      }
                      placeholder="% Sell"
                    />

                    <div className="flex items-center gap-4 p-2 rounded bg-gray-800 border border-gray-600">
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
                      className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                      value={buf.sortOrder ?? c.sortOrder}
                      onChange={(e) =>
                        setChEdit((prev) => ({
                          ...prev,
                          [c.id]: { ...prev[c.id], sortOrder: Number(e.target.value) },
                        }))
                      }
                      placeholder="Sort"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => patchChannel(c.id, chEdit[c.id] || {})}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => deleteChannel(c.id, c.label)}
                        className="text-red-500 hover:text-red-700 px-3 py-2 rounded border border-red-500 hover:border-red-700 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {chMsg && <p className="text-center mt-4 text-sm text-green-400">{chMsg}</p>}
      </section>
    </div>
  );
}
