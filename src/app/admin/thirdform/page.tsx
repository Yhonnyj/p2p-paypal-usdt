// app/admin/thirdform/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Intake = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string | null;
  
  occupation: string;
  contributorType: "COMPANY" | "FREELANCER";
  companyName: string | null;
  website: string | null;
  country: string;
  
  txPerMonth: number;
  avgPerTxUsd: string;
  rangeMinUsd: string | null;
  rangeMaxUsd: string | null;
  monthlyTotalUsd: string;
  
  serviceDescription: string;
  clientsType: "PERSONS" | "COMPANIES" | "MIXED" | null;
  clientsCountries: string | null;
  
  acceptsChargebackLiability: boolean;
  acceptsAllowedUse: boolean;
  acceptsDataProcessing: boolean;
  
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  ip: string | null;
  userAgent: string | null;
  
  // Información de geolocalización
  ipCountry: string | null;
  ipCity: string | null;
  ipRegion: string | null;
  
  user?: { 
    id: string; 
    fullName: string | null; 
    email: string;
  };
};

export default function AdminThirdFormPage() {
  const [rows, setRows] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Intake | null>(null);
  const [limits, setLimits] = useState({
    maxPerTxUsd: "200",
    maxMonthlyUsd: "1000",
    holdHours: "48",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/trusted-intake");
    const j = await r.json();
    setRows(j.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return rows;
    return rows.filter((r) =>
      r.id.toLowerCase().includes(t) ||
      r.userId.toLowerCase().includes(t) ||
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(t) ||
      r.email.toLowerCase().includes(t) ||
      r.country.toLowerCase().includes(t) ||
      (r.ipCountry || "").toLowerCase().includes(t) ||
      (r.ipCity || "").toLowerCase().includes(t) ||
      (r.ip || "").includes(t)
    );
  }, [rows, q]);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!selected) return;
    setSaving(true);

    const body =
      decision === "APPROVED"
        ? {
            decision,
            limits: {
              maxPerTxUsd: Number(limits.maxPerTxUsd),
              maxMonthlyUsd: Number(limits.maxMonthlyUsd),
              holdHours: Number(limits.holdHours),
            },
            notes: limits.notes || undefined,
          }
        : { decision, notes: limits.notes || undefined };

    const r = await fetch(`/api/admin/trusted-intake/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "No se pudo guardar la decisión");
      return;
    }
    setSelected(null);
    load();
  }

  async function updateProfile() {
    if (!selected) return;
    setSaving(true);
    const r = await fetch(`/api/admin/trusted-profile/${selected.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maxPerTxUsd: Number(limits.maxPerTxUsd),
        maxMonthlyUsd: Number(limits.maxMonthlyUsd),
        holdHours: Number(limits.holdHours),
        notes: limits.notes || null,
        enabled: true,
        status: "APPROVED",
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "No se pudo actualizar el perfil");
      return;
    }
    alert("Límites actualizados");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-900 text-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent mb-2">
            Panel Administrativo
          </h1>
          <p className="text-gray-400">Gestión de solicitudes del programa piloto</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID, nombre, email, país, ciudad o IP..."
              className="w-full rounded-2xl bg-gray-800/50 backdrop-blur border border-emerald-500/30 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-2xl px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
          >
            Recargar
          </button>
        </div>

        <div className="bg-gray-800/30 backdrop-blur rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 backdrop-blur">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">ID</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">Nombre Completo</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">Email</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">País Declarado</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">Ubicación Real</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">Estado</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">Fecha</th>
                  <th className="px-4 py-4 text-left font-semibold text-emerald-300">IP</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-400" colSpan={9}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                        Cargando solicitudes...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-400" colSpan={9}>
                      No se encontraron solicitudes
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-900/10 transition-colors duration-200">
                      <td className="px-4 py-4 font-mono text-xs text-gray-300">{r.id.slice(0, 8)}...</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{r.firstName} {r.lastName}</div>
                        <div className="text-xs text-emerald-400">@{r.username}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-300">{r.email}</td>
                      <td className="px-4 py-4 text-gray-300">{r.country}</td>
                      <td className="px-4 py-4">
                        {r.ipCountry && r.ipCity ? (
                          <div>
                            <div className="font-medium text-white">{r.ipCountry}</div>
                            <div className="text-xs text-gray-400">{r.ipCity}, {r.ipRegion}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No detectado</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          r.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-gray-400">
                        {r.ip || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelected(r);
                            setLimits({
                              maxPerTxUsd: "200",
                              maxMonthlyUsd: "1000",
                              holdHours: "48",
                              notes: "",
                            });
                          }}
                          className="rounded-xl bg-gradient-to-r from-emerald-600/80 to-green-600/80 hover:from-emerald-600 hover:to-green-600 px-4 py-2 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Completamente Nuevo */}
        {selected && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-6xl rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900/20 border border-emerald-500/30 shadow-2xl max-h-[95vh] overflow-hidden">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 backdrop-blur p-6 border-b border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Solicitud de {selected.firstName} {selected.lastName}
                    </h3>
                    <p className="text-emerald-300 text-sm">ID: {selected.id}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-white text-3xl transition-colors duration-200 hover:bg-red-500/20 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)] space-y-8">
                
                {/* Información Personal */}
                <div className="bg-emerald-900/10 backdrop-blur rounded-2xl border border-emerald-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-emerald-300 flex items-center gap-2">
                    👤 Información Personal
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Nombre Completo</span>
                      <span className="font-semibold text-white">{selected.firstName} {selected.lastName}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Username</span>
                      <span className="font-semibold text-emerald-300">@{selected.username}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Email</span>
                      <span className="font-semibold text-white">{selected.email}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Teléfono</span>
                      <span className="font-semibold text-white">{selected.phone || "No proporcionado"}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Ocupación</span>
                      <span className="font-semibold text-white">{selected.occupation}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Negocio */}
                <div className="bg-blue-900/10 backdrop-blur rounded-2xl border border-blue-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
                    🏢 Información del Negocio
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Tipo de contribuyente</span>
                      <span className="font-semibold text-white">{selected.contributorType}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Nombre de empresa</span>
                      <span className="font-semibold text-white">{selected.companyName || "No especificado"}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Sitio web</span>
                      {selected.website ? (
                        <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                          {selected.website}
                        </a>
                      ) : (
                        <span className="text-gray-500">No especificado</span>
                      )}
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">País declarado</span>
                      <span className="font-semibold text-white">{selected.country}</span>
                    </div>
                    <div className="md:col-span-2 bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-2">Descripción del servicio</span>
                      <div className="bg-gray-900/50 rounded-lg p-3 text-gray-100 border border-gray-700/50">
                        {selected.serviceDescription}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="bg-yellow-900/10 backdrop-blur rounded-2xl border border-yellow-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-yellow-300 flex items-center gap-2">
                    💰 Información Financiera
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Transacciones/mes</span>
                      <span className="font-bold text-2xl text-white">{selected.txPerMonth}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Promedio por tx</span>
                      <span className="font-bold text-2xl text-green-400">${selected.avgPerTxUsd}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Total mensual</span>
                      <span className="font-bold text-2xl text-green-400">${selected.monthlyTotalUsd}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Rango mínimo</span>
                      <span className="font-semibold text-white">{selected.rangeMinUsd ? `$${selected.rangeMinUsd}` : "No especificado"}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Rango máximo</span>
                      <span className="font-semibold text-white">{selected.rangeMaxUsd ? `$${selected.rangeMaxUsd}` : "No especificado"}</span>
                    </div>
                  </div>
                </div>

                {/* Información de Clientes */}
                <div className="bg-purple-900/10 backdrop-blur rounded-2xl border border-purple-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                    👥 Información de Clientes
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Tipo de clientes</span>
                      <span className="font-semibold text-white">{selected.clientsType || "No especificado"}</span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Países de clientes</span>
                      <span className="font-semibold text-white">{selected.clientsCountries || "No especificado"}</span>
                    </div>
                  </div>
                </div>

                {/* Información Técnica y Legal */}
                <div className="bg-red-900/10 backdrop-blur rounded-2xl border border-red-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-red-300 flex items-center gap-2">
                    🔒 Información Técnica y Legal
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">IP completa</span>
                      <span className="font-mono bg-gray-900/50 px-3 py-2 rounded-lg text-white border border-gray-700/50 block">
                        {selected.ip || "No detectada"}
                      </span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Ubicación real (IP)</span>
                      {selected.ipCountry && selected.ipCity ? (
                        <div className="text-white">
                          <div className="font-semibold">{selected.ipCity}, {selected.ipRegion}</div>
                          <div className="text-emerald-400">{selected.ipCountry}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No detectado</span>
                      )}
                    </div>
                    <div className="md:col-span-2 bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-2">User Agent</span>
                      <div className="bg-gray-900/50 rounded-lg p-3 text-gray-100 font-mono text-xs break-all border border-gray-700/50">
                        {selected.userAgent || "No detectado"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                      <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                        <span className="text-gray-400 block mb-2">Acepta chargeback</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          selected.acceptsChargebackLiability ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {selected.acceptsChargebackLiability ? "✓ Sí" : "✗ No"}
                        </span>
                      </div>
                      <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                        <span className="text-gray-400 block mb-2">Acepta términos</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          selected.acceptsAllowedUse ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {selected.acceptsAllowedUse ? "✓ Sí" : "✗ No"}
                        </span>
                      </div>
                      <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                        <span className="text-gray-400 block mb-2">Acepta datos</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          selected.acceptsDataProcessing ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {selected.acceptsDataProcessing ? "✓ Sí" : "✗ No"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Estado actual</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        selected.status === 'APPROVED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        selected.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {selected.status}
                      </span>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <span className="text-gray-400 block mb-1">Fecha de solicitud</span>
                      <span className="font-semibold text-white">{new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Configuración de Límites */}
                <div className="bg-emerald-900/10 backdrop-blur rounded-2xl border border-emerald-500/20 p-6">
                  <h4 className="text-xl font-semibold mb-4 text-emerald-300 flex items-center gap-2">
                    ⚙️ Configuración de Límites
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Máximo por transacción (USD)
                      </label>
                      <input
                        value={limits.maxPerTxUsd}
                        onChange={(e) =>
                          setLimits((s) => ({ ...s, maxPerTxUsd: e.target.value }))
                        }
                        className="w-full rounded-xl bg-gray-800/50 border border-emerald-500/30 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Máximo mensual (USD)
                      </label>
                      <input
                        value={limits.maxMonthlyUsd}
                        onChange={(e) =>
                          setLimits((s) => ({
                            ...s,
                            maxMonthlyUsd: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-gray-800/50 border border-emerald-500/30 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Retención (horas)
                      </label>
                      <input
                        value={limits.holdHours}
                        onChange={(e) =>
                          setLimits((s) => ({ ...s, holdHours: e.target.value }))
                        }
                        className="w-full rounded-xl bg-gray-800/50 border border-emerald-500/30 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea
                      value={limits.notes}
                      onChange={(e) =>
                        setLimits((s) => ({ ...s, notes: e.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-xl bg-gray-800/50 border border-emerald-500/30 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      placeholder="Agregar notas sobre esta solicitud..."
                    />
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    disabled={saving}
                    onClick={() => decide("APPROVED")}
                    className="flex-1 min-w-[200px] rounded-2xl px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold disabled:opacity-60 hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </div>
                    ) : (
                      "✓ Aprobar Solicitud"
                    )}
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => decide("REJECTED")}
                    className="flex-1 min-w-[200px] rounded-2xl px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold disabled:opacity-60 hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </div>
                    ) : (
                      "✗ Rechazar Solicitud"
                    )}
                  </button>
                  <button
                    disabled={saving}
                    onClick={updateProfile}
                    className="rounded-2xl px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold disabled:opacity-60 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 disabled:cursor-not-allowed"
                    title="Modificar límites después de aprobado"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Actualizando...
                      </div>
                    ) : (
                      "⚙️ Actualizar Límites"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}