'use client';

import React, { useEffect, useState } from 'react';

type ConsentState = {
  necessary: boolean;   // siempre true
  analytics: boolean;   // opt-in
};

const CONSENT_KEY = 'tucapi_consent';
const CONSENT_COOKIE = 'tucapi_consent';

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeConsent(consent: ConsentState) {
  const value = JSON.stringify(consent);
  localStorage.setItem(CONSENT_KEY, value);
  // Cookie con 180 días
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`;
  // Notificar a la app (por si quieres reaccionar)
  window.dispatchEvent(new CustomEvent('consent:changed', { detail: consent }));
}

export function getStoredConsent(): ConsentState | null {
  return readConsent();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(!!existing.analytics);
    }

    // Permite abrir el modal desde otras páginas (ej. Política de Privacidad)
    const openHandler = () => setModalOpen(true);
    window.addEventListener('open-cookie-preferences', openHandler);
    return () => window.removeEventListener('open-cookie-preferences', openHandler);
  }, []);

  const acceptAll = () => {
    const consent = { necessary: true, analytics: true };
    writeConsent(consent);
    setAnalytics(true);
    setVisible(false);
    setModalOpen(false);
  };

  const rejectAll = () => {
    const consent = { necessary: true, analytics: false };
    writeConsent(consent);
    setAnalytics(false);
    setVisible(false);
    setModalOpen(false);
  };

  const savePreferences = () => {
    const consent = { necessary: true, analytics };
    writeConsent(consent);
    setVisible(false);
    setModalOpen(false);
  };

  if (!visible && !modalOpen) return null;

  return (
    <>
      {/* Banner */}
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gray-900/95 backdrop-blur border border-gray-700 p-4 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-gray-200 text-sm">
                Usamos <strong>cookies necesarias</strong> para que el sitio funcione y, con tu
                consentimiento, cookies <strong>analíticas</strong> para mejorar el servicio.
                Puedes cambiar tu elección en <button
                  onClick={() => setModalOpen(true)}
                  className="underline text-emerald-400"
                >Preferencias de Cookies</button>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={rejectAll}
                  className="px-3 py-2 rounded-lg border border-gray-600 text-gray-200 text-sm hover:bg-gray-800"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-gray-800 text-gray-200 text-sm hover:bg-gray-700"
                >
                  Preferencias
                </button>
                <button
                  onClick={acceptAll}
                  className="px-3 py-2 rounded-lg bg-emerald-500 text-gray-900 text-sm font-semibold hover:bg-emerald-400"
                >
                  Aceptar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preferencias */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-gray-950 border border-gray-800 shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white">Preferencias de Cookies</h3>
            <p className="mt-2 text-sm text-gray-400">
              Controla qué cookies permites. Las cookies necesarias no pueden desactivarse.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-800 p-4 bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">Necesarias</p>
                    <p className="text-sm text-gray-400">
                      Imprescindibles para seguridad y funcionamiento básico del sitio.
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">Siempre activas</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 p-4 bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">Analíticas</p>
                    <p className="text-sm text-gray-400">
                      Nos ayudan a entender el uso del sitio para mejorarlo. No esenciales.
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <span className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-emerald-500 transition-colors relative">
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${analytics ? 'translate-x-5' : ''}`} />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={rejectAll}
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-200 text-sm hover:bg-gray-900"
              >
                Rechazar
              </button>
              <button
                onClick={savePreferences}
                className="px-3 py-2 rounded-lg bg-emerald-500 text-gray-900 text-sm font-semibold hover:bg-emerald-400"
              >
                Guardar preferencias
              </button>
              <button
                onClick={acceptAll}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-gray-900 text-sm font-semibold hover:bg-emerald-500"
              >
                Aceptar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
