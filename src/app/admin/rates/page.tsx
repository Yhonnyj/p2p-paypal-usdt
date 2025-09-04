"use client";

import { useEffect, useState } from "react";
import { Trash2, Save, PlusCircle, Loader2 } from "lucide-react";

/* ======= Tipos actualizados ======= */
interface Rate {
  id: string;
  currency: string;
  rate: number;          // Legacy
  buyRate?: number;      // Nuevo
  sellRate?: number;     // Nuevo
}

type AdminChannel = {
  id: string;
  key: string;
  label: string;
  commissionBuyPercent: number;
  commissionSellPercent: number;
  providerFeePercent: number;
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
  /* ---------- RATES ---------- */
  const [rates, setRates] = useState<Rate[]>([]);
  const [editingRates, setEditingRates] = useState<Record<string, {
    rate: number;
    buyRate: number;
    sellRate: number;
  }>>({});
  const [newCurrency, setNewCurrency] = useState("");
  const [newRate, setNewRate] = useState(0);
  const [newBuyRate, setNewBuyRate] = useState(0);
  const [newSellRate, setNewSellRate] = useState(0);
  const [ratesSuccessMessage, setRatesSuccessMessage] = useState("");

  /* ---------- PAYMENT CHANNELS ---------- */
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [chEdit, setChEdit] = useState<Record<string, Partial<AdminChannel>>>({});
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [chMsg, setChMsg] = useState<string>("");

  // crear nuevo método
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPctBuy, setNewPctBuy] = useState<number>(0);
  const [newPctSell, setNewPctSell] = useState<number>(0);
  const [newProviderFee, setNewProviderFee] = useState<number>(0);
  const [newEnabledBuy, setNewEnabledBuy] = useState(true);
  const [newEnabledSell, setNewEnabledSell] = useState(true);
  const [newVisible, setNewVisible] = useState(true);
  const [newSort, setNewSort] = useState<number>(0);
  const [newStatusBuy, setNewStatusBuy] = useState<string>("");
  const [newStatusSell, setNewStatusSell] = useState<string>("");

  /* --------- Rates API --------- */
  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/rates", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRates(data);
        const mapped: Record<string, { rate: number; buyRate: number; sellRate: number }> = {};
        (data as Rate[]).forEach((r) => {
          mapped[r.id] = {
            rate: r.rate,
            buyRate: r.buyRate || r.rate, // Fallback al rate legacy
            sellRate: r.sellRate || 0
          };
        });
        setEditingRates(mapped);
      }
    } catch (error) {
      console.error("Error cargando tasas", error);
    }
  };

  const handleSaveRate = async (rate: Rate) => {
    try {
      const editData = editingRates[rate.id];
      const res = await fetch(`/api/admin/rates/${rate.currency}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rate: editData.rate,
          buyRate: editData.buyRate,
          sellRate: editData.sellRate
        }),
      });
      if (res.ok) {
        setRatesSuccessMessage("✅ Tasas actualizadas correctamente");
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
        body: JSON.stringify({ 
          currency: newCurrency.toUpperCase(), 
          rate: newRate,
          buyRate: newBuyRate,
          sellRate: newSellRate
        }),
      });
      if (res.ok) {
        setNewCurrency("");
        setNewRate(0);
        setNewBuyRate(0);
        setNewSellRate(0);
        fetchRates();
      }
    } catch (err) {
      console.error("Error agregando moneda", err);
    }
  };

  const handleRateInputChange = (id: string, field: 'rate' | 'buyRate' | 'sellRate', value: string) => {
    const parsed = parseFloat(value.replace(",", "."));
    if (!isNaN(parsed)) {
      setEditingRates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: parsed
        }
      }));
    }
  };

  /* --------- Payment Channels API (sin cambios) --------- */
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
            providerFeePercent: c.providerFeePercent,
            enabledBuy: c.enabledBuy,
            enabledSell: c.enabledSell,
            visible: c.visible,
            statusTextBuy: c.statusTextBuy,
            statusTextSell: c.statusTextSell,
            sortOrder: c.sortOrder,
            label: c.label,
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
          providerFeePercent: Number(newProviderFee),
          enabledBuy: newEnabledBuy,
          enabledSell: newEnabledSell,
          visible: newVisible,
          statusTextBuy: newStatusBuy.trim() || null,
          statusTextSell: newStatusSell.trim() || null,
          sortOrder: Number(newSort),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChMsg("✅ Método creado");
        setNewKey(""); setNewLabel("");
        setNewPctBuy(0); setNewPctSell(0);
        setNewProviderFee(0);
        setNewEnabledBuy(true); setNewEnabledSell(true);
        setNewVisible(true); setNewSort(0);
        setNewStatusBuy(""); setNewStatusSell("");
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

  /* --------- Initial Load --------- */
  useEffect(() => {
    fetchRates();
    fetchChannels();
  }, []);

  /* ========= UI ========= */
  return (
    <div className="relative min-h-screen px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10 bg-gray-950 text-white overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 opacity-10 animate-pulse-light pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}
      />

      <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold mb-4 sm:mb-6 lg:mb-10 text-center text-green-400">
        🚀 Panel de Administración
      </h1>

      {/* RATES */}
      <section className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-lg sm:text-xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6 text-green-400 border-b border-gray-700 pb-2 lg:pb-3">
          💱 Gestión de Tasas de Cambio
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm sm:text-base lg:text-lg">{rate.currency}</div>
                <div className="text-xs text-gray-400">
                  Tasas BUY/SELL
                </div>
              </div>

              {/* Grid de 3 columnas para las tasas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rate (Legacy)</label>
                  <input
                    type="number"
                    value={editingRates[rate.id]?.rate || 0}
                    onChange={(e) => handleRateInputChange(rate.id, 'rate', e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                    step={0.0001}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Buy Rate</label>
                  <input
                    type="number"
                    value={editingRates[rate.id]?.buyRate || 0}
                    onChange={(e) => handleRateInputChange(rate.id, 'buyRate', e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                    step={0.0001}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sell Rate</label>
                  <input
                    type="number"
                    value={editingRates[rate.id]?.sellRate || 0}
                    onChange={(e) => handleRateInputChange(rate.id, 'sellRate', e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                    step={0.0001}
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => handleSaveRate(rate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-sm flex-1"
                >
                  <Save size={14} className="sm:w-4 sm:h-4" />
                  Guardar
                </button>

                <button
                  onClick={() => handleDeleteRate(rate.currency)}
                  className="text-red-500 hover:text-red-700 px-3 sm:px-4 py-2 rounded border border-red-500 hover:border-red-700 flex items-center justify-center gap-1 sm:gap-2 text-sm"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8 border-t border-gray-700 pt-4 sm:pt-6">
          <h3 className="text-green-400 mb-3 sm:mb-4 font-semibold flex items-center gap-2 text-sm sm:text-base">
            <PlusCircle size={16} className="sm:w-5 sm:h-5" /> Agregar nueva moneda
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código</label>
              <input
                type="text"
                placeholder="BS"
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rate (Legacy)</label>
              <input
                type="number"
                placeholder="0"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Buy Rate</label>
              <input
                type="number"
                placeholder="0"
                value={newBuyRate}
                onChange={(e) => setNewBuyRate(Number(e.target.value))}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sell Rate</label>
              <input
                type="number"
                placeholder="0"
                value={newSellRate}
                onChange={(e) => setNewSellRate(Number(e.target.value))}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                step={0.01}
              />
            </div>
          </div>

          <button
            onClick={handleAddRate}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto text-sm"
          >
            + Agregar Moneda
          </button>
        </div>

        {ratesSuccessMessage && (
          <p className="text-green-400 mt-4 text-center text-sm">{ratesSuccessMessage}</p>
        )}
      </section>

      {/* PAYMENT CHANNELS (sin cambios - copiar del original) */}
      <section className="mt-8 sm:mt-10 lg:mt-14">
        <h2 className="text-lg sm:text-xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6 text-green-400 border-b border-gray-700 pb-2 lg:pb-3">
          💳 Métodos de Pago (Payment Channels)
        </h2>

        {/* Crear nuevo */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
          <h3 className="text-green-400 mb-3 sm:mb-4 font-semibold flex items-center gap-2 text-sm sm:text-base">
            <PlusCircle size={16} className="sm:w-5 sm:h-5" /> Crear nuevo método
          </h3>

          {/* Grid responsive mejorado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Clave (KEY)</label>
              <input
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="Ej: PAYPAL"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre (Label)</label>
              <input
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="Ej: PayPal"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">% Comisión Buy</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="0.00"
                value={newPctBuy}
                onChange={(e) => setNewPctBuy(Number(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">% Comisión Sell</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="0.00"
                value={newPctSell}
                onChange={(e) => setNewPctSell(Number(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">% Fee Proveedor</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="4.5 (PayPal), 0 (Zelle)"
                value={newProviderFee}
                onChange={(e) => setNewProviderFee(Number(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Orden (Sort)</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="0"
                value={newSort}
                onChange={(e) => setNewSort(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status Buy (opcional)</label>
              <textarea
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="Mensaje para compras..."
                value={newStatusBuy}
                onChange={(e) => setNewStatusBuy(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status Sell (opcional)</label>
              <textarea
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                placeholder="Mensaje para ventas..."
                value={newStatusSell}
                onChange={(e) => setNewStatusSell(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 items-center mt-3 p-2 rounded bg-gray-800 border border-gray-600">
            <label className="flex items-center gap-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={newEnabledBuy}
                onChange={(e) => setNewEnabledBuy(e.target.checked)}
                className="w-4 h-4"
              />
              Habilitar Buy
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={newEnabledSell}
                onChange={(e) => setNewEnabledSell(e.target.checked)}
                className="w-4 h-4"
              />
              Habilitar Sell
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={newVisible}
                onChange={(e) => setNewVisible(e.target.checked)}
                className="w-4 h-4"
              />
              Visible
            </label>
          </div>

          <div className="mt-3">
            <button
              onClick={createChannel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto text-sm"
            >
              + Agregar método
            </button>
          </div>
        </div>

        {/* Lista / edición */}
        <div className="space-y-3">
          {loadingChannels ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay métodos creados.</p>
          ) : (
            channels.map((c) => {
              const buf = chEdit[c.id] || {};
              return (
                <div
                  key={c.id}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col gap-3 sm:gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm sm:text-base lg:text-lg">{buf.label ?? c.label}</div>
                      <div className="text-xs text-gray-400">{c.key}</div>
                    </div>
                  </div>

                  {/* Grid mejorado para edición */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                      <input
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        value={buf.label ?? c.label}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], label: e.target.value },
                          }))
                        }
                        placeholder="Label"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">% Buy</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        value={buf.commissionBuyPercent ?? c.commissionBuyPercent}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], commissionBuyPercent: Number(e.target.value) },
                          }))
                        }
                        placeholder="% Buy"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">% Sell</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        value={buf.commissionSellPercent ?? c.commissionSellPercent}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], commissionSellPercent: Number(e.target.value) },
                          }))
                        }
                        placeholder="% Sell"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">% Fee Proveedor</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        value={buf.providerFeePercent ?? c.providerFeePercent}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], providerFeePercent: Number(e.target.value) },
                          }))
                        }
                        placeholder="% Proveedor"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Orden</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        value={buf.sortOrder ?? c.sortOrder}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], sortOrder: Number(e.target.value) },
                          }))
                        }
                        placeholder="Sort"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Opciones</label>
                      <div className="flex flex-wrap items-center gap-2 p-2 rounded bg-gray-800 border border-gray-600">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={(buf.enabledBuy ?? c.enabledBuy) as boolean}
                            onChange={(e) =>
                              setChEdit((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], enabledBuy: e.target.checked },
                              }))
                            }
                            className="w-3 h-3"
                          />
                          Buy
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={(buf.enabledSell ?? c.enabledSell) as boolean}
                            onChange={(e) =>
                              setChEdit((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], enabledSell: e.target.checked },
                              }))
                            }
                            className="w-3 h-3"
                          />
                          Sell
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={(buf.visible ?? c.visible) as boolean}
                            onChange={(e) =>
                              setChEdit((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], visible: e.target.checked },
                              }))
                            }
                            className="w-3 h-3"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status Buy</label>
                      <textarea
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        placeholder="Status Buy"
                        rows={2}
                        value={buf.statusTextBuy ?? c.statusTextBuy ?? ""}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], statusTextBuy: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status Sell</label>
                      <textarea
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm"
                        placeholder="Status Sell"
                        rows={2}
                        value={buf.statusTextSell ?? c.statusTextSell ?? ""}
                        onChange={(e) =>
                          setChEdit((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], statusTextSell: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => patchChannel(c.id, chEdit[c.id] || {})}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                    >
                      <Save size={14} /> Guardar
                    </button>
                    <button
                      onClick={() => deleteChannel(c.id, c.label)}
                      className="text-red-500 hover:text-red-700 px-3 py-2 rounded border border-red-500 hover:border-red-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 size={14} /> Borrar
                    </button>
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