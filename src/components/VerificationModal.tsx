'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerificationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [previewSelfie, setPreviewSelfie] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (documentFile) {
      const url = URL.createObjectURL(documentFile);
      setPreviewDoc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewDoc(null);
    }
  }, [documentFile]);

  useEffect(() => {
    if (selfieFile) {
      const url = URL.createObjectURL(selfieFile);
      setPreviewSelfie(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewSelfie(null);
    }
  }, [selfieFile]);

  const handleSubmit = async () => {
    if (!documentFile || !selfieFile) {
      toast.error("Debes subir ambos archivos");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB

if (documentFile.size > maxSize || selfieFile.size > maxSize) {
  toast.error("Uno de los archivos es demasiado grande (máx. 5MB)");
  return;
}


    if (!documentFile.type.startsWith("image/") || !selfieFile.type.startsWith("image/")) {
      toast.error("Los archivos deben ser imágenes válidas");
      return;
    }

   setSubmitting(true);
try {
  const formData = new FormData();
  formData.append("document", documentFile);
  formData.append("selfie", selfieFile);

  const res = await fetch("/api/verifications", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  let data: any = null;

  try {
    data = await res.json();
  } catch (jsonError) {
    console.error("❌ Error al leer respuesta JSON:", jsonError);
  }

  if (!res.ok) {
    const errorMsg =
      data?.error || `Error al enviar verificación (código ${res.status})`;
    toast.error(errorMsg);
  } else {
    toast.success("✅ Verificación enviada correctamente");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
      setDocumentFile(null);
      setSelfieFile(null);
    }, 1500);
  }

} catch (err: unknown) {
  console.error("❌ Error inesperado en frontend:", err);
  toast.error("Error inesperado al enviar verificación");
} finally {
  setSubmitting(false);
}

  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0">
      <div className="flex items-center justify-center min-h-screen backdrop-blur bg-black/30 px-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-xl w-full bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-gray-700"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 size={64} className="text-green-500 mb-4" />
                <p className="text-lg font-semibold text-green-400">Verificación enviada correctamente</p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-2xl font-bold mb-4 text-green-400">
                  Verificación de Identidad
                </Dialog.Title>

                <p className="text-sm text-gray-300 mb-4">
                  Sube una selfie sosteniendo tu documento (Pasaporte o Cédula).
                </p>

                <div className="mb-6 flex flex-wrap gap-4 justify-center">
                  <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center">
                    {!previewSelfie && (
                      <span className="absolute top-1 left-1 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">
                        Ejemplo
                      </span>
                    )}
                    <img
                      src={previewSelfie || "/ejemplo-selfie.png"}
                      alt="Selfie subida"
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    {previewSelfie && (
                      <div className="absolute top-1 right-1 text-green-500 bg-black/70 p-1 rounded-full animate-bounce">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>

                  <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center">
                    {!previewDoc && (
                      <span className="absolute top-1 left-1 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">
                        Ejemplo
                      </span>
                    )}
                    <img
                      src={previewDoc || "/ejemplo-documento.png"}
                      alt="Documento subido"
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    {previewDoc && (
                      <div className="absolute top-1 right-1 text-green-500 bg-black/70 p-1 rounded-full animate-bounce">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="document" className="block text-sm text-gray-300 mb-1">
                      Documento de identidad
                    </label>
                    <input
                      id="document"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="selfie" className="block text-sm text-gray-300 mb-1">
                      Selfie con documento en mano
                    </label>
                    <input
                      id="selfie"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                      className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95"
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "Enviar verificación"
                  )}
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
