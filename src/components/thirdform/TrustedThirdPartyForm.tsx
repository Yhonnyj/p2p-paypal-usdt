// src/components/thirdform/TrustedThirdPartyForm.tsx
"use client";

import React, { useEffect, useState } from "react";

type Profile =
  | {
      enabled: boolean;
      status: "PENDING" | "APPROVED" | "REJECTED";
      maxPerTxUsd: string;
      maxMonthlyUsd: string;
      holdHours: number;
      notes: string | null;
      updatedAt: string;
    }
  | null;

export default function TrustedThirdPartyForm() {
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trusted-profile").then(async (r) => {
      try {
        const j = await r.json();
        if (j?.profile) setProfile(j.profile);
      } catch {
        // no-op
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const required = [
      "firstName",
      "lastName",
      "email",
      "username",
      "occupation",
      "country",
      "txPerMonth",
      "avgPerTxUsd",
      "monthlyTotalUsd",
      "serviceDescription",
      "contributorType",
    ];
    for (const k of required) {
      const v = fd.get(k);
      if (!v || String(v).trim() === "") {
        setLoading(false);
        setErrMsg("Completa todos los campos obligatorios.");
        return;
      }
    }
    if (
      !fd.get("acceptsChargebackLiability") ||
      !fd.get("acceptsAllowedUse") ||
      !fd.get("acceptsDataProcessing")
    ) {
      setLoading(false);
      setErrMsg("Debes aceptar las declaraciones obligatorias.");
      return;
    }

    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/trusted-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "No se pudo enviar");
      setOkMsg("Solicitud enviada. Te confirmaremos por este medio.");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error inesperado";
      setErrMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const label = "block text-sm text-gray-300 mb-1";
  const input =
    "w-full rounded-xl bg-gray-900/50 border border-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const group = "grid grid-cols-1 md:grid-cols-2 gap-4";
  const section =
    "rounded-2xl border border-gray-800 bg-[#0B0F1A] p-4 md:p-6 mb-6";

  return (
    <div>
      {profile && (
        <div className="mb-6 rounded-2xl border border-emerald-700/40 bg-emerald-900/10 p-4">
          <p className="text-sm">Estado actual del piloto:</p>
          <p className="mt-1 text-emerald-300 font-medium">
            {profile.enabled
              ? `Habilitado (${profile.status})`
              : `No habilitado (${profile.status})`}
          </p>
          {profile.enabled && (
            <div className="mt-2 text-sm text-gray-300">
              <div>
                Límite por transacción:{" "}
                <span className="font-semibold">USD {profile.maxPerTxUsd}</span>
              </div>
              <div>
                Límite mensual:{" "}
                <span className="font-semibold">USD {profile.maxMonthlyUsd}</span>
              </div>
              <div>
                Liberación estimada:{" "}
                <span className="font-semibold">{profile.holdHours} h</span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="text-gray-100">
        {/* 1) Datos del solicitante */}
        <div className={section}>
          <h2 className="text-lg font-medium mb-4">1) Datos del solicitante</h2>
          <div className={group}>
            <div>
              <label className={label}>Nombre *</label>
              <input name="firstName" className={input} placeholder="Juan" />
            </div>
            <div>
              <label className={label}>Apellido *</label>
              <input name="lastName" className={input} placeholder="Pérez" />
            </div>
            <div>
              <label className={label}>Email *</label>
              <input
                type="email"
                name="email"
                className={input}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <label className={label}>Usuario en la plataforma *</label>
              <input name="username" className={input} placeholder="@tuusuario" />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Teléfono / WhatsApp</label>
              <input name="phone" className={input} placeholder="+1 234 567 8900" />
            </div>
          </div>
        </div>

        {/* 2) Actividad económica */}
        <div className={section}>
          <h2 className="text-lg font-medium mb-4">2) Actividad económica</h2>
          <div className={group}>
            <div className="md:col-span-2">
              <label className={label}>¿A qué te dedicas? *</label>
              <input
                name="occupation"
                className={input}
                placeholder="Ej: agencia de marketing, freelance, e-commerce…"
              />
            </div>
            <div>
              <label className={label}>Tipo de contribuyente *</label>
              <select
                name="contributorType"
                className={input}
                defaultValue="FREELANCER"
              >
                <option value="FREELANCER">Freelancer / Independiente</option>
                <option value="COMPANY">Empresa</option>
              </select>
            </div>
            <div>
              <label className={label}>País de operación *</label>
              <input name="country" className={input} placeholder="Canadá" />
            </div>
            <div>
              <label className={label}>Nombre de la empresa</label>
              <input name="companyName" className={input} placeholder="(si aplica)" />
            </div>
            <div>
              <label className={label}>Sitio web o redes</label>
              <input name="website" className={input} placeholder="https://…" />
            </div>
          </div>
        </div>

        {/* 3) Volumen estimado */}
        <div className={section}>
          <h2 className="text-lg font-medium mb-4">3) Volumen estimado</h2>
          <div className={group}>
            <div>
              <label className={label}>Transacciones / mes *</label>
              <input
                type="number"
                min={0}
                name="txPerMonth"
                className={input}
                placeholder="20"
              />
            </div>
            <div>
              <label className={label}>Promedio por transacción (USD) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="avgPerTxUsd"
                className={input}
                placeholder="120"
              />
            </div>
            <div>
              <label className={label}>Mín por transacción (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="rangeMinUsd"
                className={input}
                placeholder="30"
              />
            </div>
            <div>
              <label className={label}>Máx por transacción (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="rangeMaxUsd"
                className={input}
                placeholder="500"
              />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Total mensual estimado (USD) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="monthlyTotalUsd"
                className={input}
                placeholder="2400"
              />
            </div>
          </div>
        </div>

        {/* 4) Servicio ofrecido */}
        <div className={section}>
          <h2 className="text-lg font-medium mb-4">4) Servicio ofrecido</h2>
          <div className="space-y-4">
            <div>
              <label className={label}>Tipo de servicio que prestas *</label>
              <input
                name="serviceDescription"
                className={input}
                placeholder="Ej: gestión de campañas, desarrollo web…"
              />
            </div>
            <div>
              <label className={label}>Tipo de clientes</label>
              <select name="clientsType" className={input} defaultValue="">
                <option value="">Seleccionar…</option>
                <option value="PERSONS">Personas</option>
                <option value="COMPANIES">Empresas</option>
                <option value="MIXED">Mixto</option>
              </select>
            </div>
            <div>
              <label className={label}>Países de tus clientes</label>
              <input
                name="clientsCountries"
                className={input}
                placeholder="Ej: Canadá, USA, Venezuela"
              />
            </div>
          </div>
        </div>

        {/* 5) Declaraciones */}
        <div className={section}>
          <h2 className="text-lg font-medium mb-4">5) Declaraciones</h2>
          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptsChargebackLiability"
                className="mt-1"
              />
              <span>
                <strong>Responsabilidad por contracargos:</strong> Me hago
                responsable por cualquier contracargo que se genere por mis
                clientes y autorizo el descuento de montos, comisiones y costos
                asociados según Términos del servicio.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="acceptsAllowedUse" className="mt-1" />
              <span>
                <strong>Uso permitido:</strong> Declaro que no usaré el servicio
                para actividades restringidas o ilícitas y que cumpliré con los
                requisitos KYC/KYB aplicables.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptsDataProcessing"
                className="mt-1"
              />
              <span>
                <strong>Tratamiento de datos:</strong> Acepto que esta
                información se almacene junto a mi cuenta para evaluación de
                riesgo, prevención de fraude y soporte, conforme a Términos y
                Política de Privacidad.
              </span>
            </label>
          </div>
        </div>

        {errMsg && <p className="text-red-400 mb-4">{errMsg}</p>}
        {okMsg && <p className="text-emerald-400 mb-4">{okMsg}</p>}

        <button
          disabled={loading}
          className="w-full md:w-auto rounded-2xl px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium shadow-xl disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>
    </div>
  );
}