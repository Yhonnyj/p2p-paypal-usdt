"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIos = (): boolean =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
  !(navigator as any).standalone;

const isAndroid = (): boolean =>
  typeof window !== "undefined" &&
  /android/.test(window.navigator.userAgent.toLowerCase());

export default function AddToHomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem("tucapi-install-prompt");
    if (alreadyShown) return;

    const listener = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      deferredPrompt = event;
      setCanInstall(true);
      setTimeout(() => setIsOpen(true), 1500);
      localStorage.setItem("tucapi-install-prompt", "true");
    };

    window.addEventListener("beforeinstallprompt", listener);

    return () => {
      window.removeEventListener("beforeinstallprompt", listener);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsOpen(false);
      }
      deferredPrompt = null;
    }
  };

  const closeModal = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onClose={closeModal} className="fixed z-50 inset-0">
      <div className="flex items-center justify-center min-h-screen backdrop-blur bg-black/40 px-4">
        <Dialog.Panel className="relative max-w-md w-full bg-gray-900 text-white p-6 rounded-2xl border border-gray-700">
          <button onClick={closeModal} className="absolute top-4 right-4">
            <X size={20} />
          </button>

          <Dialog.Title className="text-xl font-bold text-green-400 mb-3">
            Instala TuCapi como app
          </Dialog.Title>

          <p className="text-sm text-gray-300 mb-4">
            Así puedes tener acceso rápido desde tu pantalla de inicio:
          </p>

          {isIos() && (
            <ol className="space-y-2 text-sm text-gray-200 list-decimal pl-5">
              <li>Toca el botón <strong>“Compartir”</strong> en Safari.</li>
              <li>Selecciona <strong>“Agregar a pantalla de inicio”</strong>.</li>
              <li>Confirma y listo ✅</li>
            </ol>
          )}

          {isAndroid() && canInstall && (
            <div className="mt-4">
              <button
                onClick={handleInstall}
                className="w-full py-2 px-4 rounded-xl bg-green-500 hover:bg-green-600 transition text-white font-semibold"
              >
                Instalar ahora
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            Esta ventana solo se mostrará una vez.
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
