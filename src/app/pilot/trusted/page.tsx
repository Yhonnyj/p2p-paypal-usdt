// src/app/pilot/trusted/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/* ---------- Tipos ---------- */
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

/* ---------- Página (CLIENT) con formulario embebido ---------- */
export default function PilotTrustedPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Guard de acceso (cliente): si no hay sesión, redirige al login del piloto
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) router.replace("/pilot/sign-in");
  }, [isLoaded, user, router]);

  // Evita parpadeos mientras Clerk carga
  if (!isLoaded) {
    return (
      <main className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-900 text-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Cargando aplicación...</span>
        </div>
      </main>
    );
  }

  // (Si no hay usuario, ya estamos redirigiendo)
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-900 text-gray-100 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent mb-4">
            Programa Piloto de Pagos de Terceros
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Únete a nuestro programa exclusivo para procesar pagos de terceros con 
            límites personalizados y condiciones preferenciales.
          </p>
        </div>
        <TrustedThirdPartyFormInline />
      </div>
    </main>
  );
}

/* ---------- Formulario inline (sin componentes externos) ---------- */
function TrustedThirdPartyFormInline() {
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
      setOkMsg("🎉 Solicitud enviada exitosamente. Te contactaremos pronto para confirmar tu participación en el programa piloto.");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error inesperado";
      setErrMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const label = "block text-sm font-semibold text-gray-300 mb-2";
  const input =
    "w-full rounded-xl bg-gray-800/50 backdrop-blur border border-emerald-500/30 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200";
  const select =
    "w-full rounded-xl bg-gray-800/50 backdrop-blur border border-emerald-500/30 px-4 py-3 text-gray-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200";
  const group = "grid grid-cols-1 md:grid-cols-2 gap-6";
  const section =
    "rounded-3xl border border-emerald-500/20 bg-gray-800/20 backdrop-blur p-6 md:p-8 mb-8 shadow-2xl";

  return (
    <div>
      {profile && (
        <div className="mb-8 rounded-3xl border border-emerald-400/40 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <h3 className="text-lg font-semibold text-emerald-300">Estado del Programa Piloto</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-2xl p-4">
              <p className="text-sm text-gray-400 mb-1">Estado Actual</p>
              <p className={`text-lg font-bold ${
                profile.status === 'APPROVED' ? 'text-emerald-300' :
                profile.status === 'REJECTED' ? 'text-red-300' :
                'text-yellow-300'
              }`}>
                {profile.enabled ? `✓ Habilitado (${profile.status})` : `⏳ ${profile.status}`}
              </p>
            </div>
            
            {profile.enabled && (
              <>
                <div className="bg-gray-800/30 rounded-2xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Límite por Transacción</p>
                  <p className="text-lg font-bold text-white">USD ${profile.maxPerTxUsd}</p>
                </div>
                <div className="bg-gray-800/30 rounded-2xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Límite Mensual</p>
                  <p className="text-lg font-bold text-white">USD ${profile.maxMonthlyUsd}</p>
                </div>
                <div className="bg-gray-800/30 rounded-2xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Tiempo de Liberación</p>
                  <p className="text-lg font-bold text-white">{profile.holdHours} horas</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="text-gray-100">
        {/* 1) Datos del solicitante */}
        <div className={section}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-bold text-emerald-300">Información Personal</h2>
          </div>
          <div className={group}>
            <div>
              <label className={label}>Nombre *</label>
              <input 
                name="firstName" 
                className={input} 
                placeholder="Juan" 
                required
              />
            </div>
            <div>
              <label className={label}>Apellido *</label>
              <input 
                name="lastName" 
                className={input} 
                placeholder="Pérez" 
                required
              />
            </div>
            <div>
              <label className={label}>Email *</label>
              <input
                type="email"
                name="email"
                className={input}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className={label}>Usuario en la plataforma *</label>
              <input 
                name="username" 
                className={input} 
                placeholder="@tuusuario" 
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Teléfono / WhatsApp</label>
              <input 
                name="phone" 
                className={input} 
                placeholder="+1 234 567 8900" 
              />
            </div>
          </div>
        </div>

        {/* 2) Actividad económica */}
        <div className={section}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">2</div>
            <h2 className="text-xl font-bold text-blue-300">Actividad Económica</h2>
          </div>
          <div className={group}>
            <div className="md:col-span-2">
              <label className={label}>¿A qué te dedicas? *</label>
              <input
                name="occupation"
                className={input}
                placeholder="Ej: agencia de marketing, freelance, e-commerce, consultoría..."
                required
              />
            </div>
            <div>
              <label className={label}>Tipo de contribuyente *</label>
              <select
                name="contributorType"
                className={select}
                defaultValue="FREELANCER"
                required
              >
                <option value="FREELANCER">🧑‍💼 Freelancer / Independiente</option>
                <option value="COMPANY">🏢 Empresa</option>
              </select>
            </div>
            <div>
              <label className={label}>País de operación *</label>
              <input 
                name="country" 
                className={input} 
                placeholder="Canadá" 
                required
              />
            </div>
            <div>
              <label className={label}>Nombre de la empresa</label>
              <input 
                name="companyName" 
                className={input} 
                placeholder="(si aplica)" 
              />
            </div>
            <div>
              <label className={label}>Sitio web o redes</label>
              <input 
                name="website" 
                className={input} 
                placeholder="https://tusitio.com" 
              />
            </div>
          </div>
        </div>

        {/* 3) Volumen estimado */}
        <div className={section}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold">3</div>
            <h2 className="text-xl font-bold text-yellow-300">Volumen de Transacciones</h2>
          </div>
          <div className={group}>
            <div>
              <label className={label}>Transacciones por mes *</label>
              <input
                type="number"
                min={1}
                name="txPerMonth"
                className={input}
                placeholder="20"
                required
              />
            </div>
            <div>
              <label className={label}>Promedio por transacción (USD) *</label>
              <input
                type="number"
                min={1}
                step="0.01"
                name="avgPerTxUsd"
                className={input}
                placeholder="120.00"
                required
              />
            </div>
            <div>
              <label className={label}>Mínimo por transacción (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="rangeMinUsd"
                className={input}
                placeholder="30.00"
              />
            </div>
            <div>
              <label className={label}>Máximo por transacción (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="rangeMaxUsd"
                className={input}
                placeholder="500.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Total mensual estimado (USD) *</label>
              <input
                type="number"
                min={1}
                step="0.01"
                name="monthlyTotalUsd"
                className={input}
                placeholder="2400.00"
                required
              />
            </div>
          </div>
        </div>

        {/* 4) Servicio ofrecido */}
        <div className={section}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">4</div>
            <h2 className="text-xl font-bold text-purple-300">Servicios que Ofreces</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className={label}>Describe tu servicio principal *</label>
              <input
                name="serviceDescription"
                className={input}
                placeholder="Ej: gestión de campañas publicitarias, desarrollo web, consultoría..."
                required
              />
            </div>
            <div className={group}>
              <div>
                <label className={label}>Tipo de clientes</label>
                <select name="clientsType" className={select} defaultValue="">
                  <option value="">Seleccionar...</option>
                  <option value="PERSONS">👤 Personas</option>
                  <option value="COMPANIES">🏢 Empresas</option>
                  <option value="MIXED">🤝 Mixto</option>
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
        </div>

        {/* 5) Declaraciones */}
        <div className={section}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">5</div>
            <h2 className="text-xl font-bold text-red-300">Términos y Condiciones</h2>
          </div>
          <div className="space-y-6 text-sm">
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/30 border border-gray-600/30 hover:border-emerald-500/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="acceptsChargebackLiability"
                className="mt-1 w-5 h-5 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500"
                required
              />
              <div>
                <p className="font-semibold text-white mb-2">⚠️ Responsabilidad por contracargos</p>
                <p className="text-gray-300">
                  Me hago responsable por cualquier contracargo que se genere por mis
                  clientes y autorizo el descuento de montos, comisiones y costos
                  asociados según Términos del servicio.
                </p>
              </div>
            </label>
            
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/30 border border-gray-600/30 hover:border-emerald-500/30 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                name="acceptsAllowedUse" 
                className="mt-1 w-5 h-5 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500"
                required
              />
              <div>
                <p className="font-semibold text-white mb-2">✅ Uso permitido</p>
                <p className="text-gray-300">
                  Declaro que no usaré el servicio para actividades restringidas o 
                  ilícitas y que cumpliré con los requisitos KYC/KYB aplicables.
                </p>
              </div>
            </label>
            
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/30 border border-gray-600/30 hover:border-emerald-500/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="acceptsDataProcessing"
                className="mt-1 w-5 h-5 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500"
                required
              />
              <div>
                <p className="font-semibold text-white mb-2">🔒 Tratamiento de datos</p>
                <p className="text-gray-300">
                  Acepto que esta información se almacene junto a mi cuenta para 
                  evaluación de riesgo, prevención de fraude y soporte, conforme a 
                  Términos y Política de Privacidad.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Mensajes de estado */}
        {errMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-900/20 border border-red-500/30 text-red-300">
            <p className="font-semibold">❌ Error</p>
            <p>{errMsg}</p>
          </div>
        )}
        
        {okMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-emerald-300">
            <p>{okMsg}</p>
          </div>
        )}

        {/* Botón de envío */}
        <div className="text-center">
          <button
            disabled={loading}
            className="w-full md:w-auto min-w-[300px] rounded-2xl px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-emerald-500/25"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando solicitud...
              </div>
            ) : (
              "🚀 Enviar Solicitud al Programa Piloto"
            )}
          </button>
          
          <p className="mt-4 text-sm text-gray-400">
            Procesaremos tu solicitud en 24-48 horas hábiles
          </p>
        </div>
      </form>
    </div>
  );
}