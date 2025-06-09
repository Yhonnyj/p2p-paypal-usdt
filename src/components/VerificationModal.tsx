"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import Image from "next/image";

export default function VerificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!documentFile || !selfieFile) {
      setMessage("Debes subir ambos archivos");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("selfie", selfieFile);

      const res = await fetch("/api/verification", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error al enviar verificación");
      } else {
        setMessage("✅ Verificación enviada correctamente");
      }
    } catch {
      setMessage("Error inesperado al enviar verificación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0">
      <div className="flex items-center justify-center min-h-screen backdrop-blur bg-black/30 px-4">
        <Dialog.Panel className="relative max-w-xl w-full bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <Dialog.Title className="text-2xl font-bold mb-4 text-green-400">
            Verificación de Identidad
          </Dialog.Title>

          <p className="text-sm text-gray-300 mb-4">
            Sube una selfie sosteniendo tu documento (Pasaporte o Cédula).
          </p>
<div className="mb-6 flex justify-center gap-4">
  <div className="w-48 rounded-lg overflow-hidden border border-gray-700 shadow">
    <Image
      src="/ejemplo-selfie.png"
      alt="Ejemplo de selfie con documento"
      width={192}
      height={160}
      unoptimized
      className="w-full h-auto object-cover"
    />
  </div>
  <div className="w-48 rounded-lg overflow-hidden border border-gray-700 shadow">
    <Image
      src="/ejemplo-documento.png"
      alt="Ejemplo de documento"
      width={192}
      height={160}
      unoptimized
      className="w-full h-auto object-cover"
    />
  </div>
</div>



          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Documento de identidad
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Selfie con documento en mano
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
              />
            </div>
          </div>

          {message && <p className="mt-4 text-sm text-yellow-400">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar verificación"}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
