// src/app/admin/verifications/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher"; // Asegúrate de tener este import y que Pusher esté configurado
import { motion, AnimatePresence } from "framer-motion"; // Importar Framer Motion
import {
  Loader2,
  CircleX,
  CheckCircle,
  XCircle,
  User,
  Mail,
  FileText, // Para icono de documento
  Camera, // Para icono de selfie
  CheckCircle2,
  Clock, // Para el botón de Aprobar
} from "lucide-react"; // Importar iconos adicionales
import { toast, ToastContainer } from 'react-toastify'; // Importar ToastContainer si no está en layout global

interface VerificationItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string;
  selfieUrl: string;
  user: {
    email: string;
    fullName: string | null;
  } | null;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Estado para manejar errores de fetch

  // Nuevo estado para la URL de la imagen en pantalla completa
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

// Función para obtener las verificaciones desde la API
const fetchVerifications = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/admin/verifications");
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al cargar las verificaciones.");
    }
    const data: VerificationItem[] = await res.json();
    setVerifications(data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error fetching verifications:", error);
    setError(error.message || "Error desconocido al cargar verificaciones.");
    toast.error(`Error: ${error.message || "No se pudieron cargar las verificaciones."}`);
  } finally {
    setLoading(false);
  }
};


  // Función para actualizar el estado de una verificación
  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error al ${status === "APPROVED" ? "aprobar" : "rechazar"} la verificación.`);
      }

      // La actualización se reflejará a través de Pusher, así que no se necesita fetchVerifications aquí directamente
      toast.success(`Verificación ${id.substring(0, 8)}... ${status === "APPROVED" ? "aprobada" : "rechazada"} con éxito.`);
    } catch (err: any) {
      console.error("Error updating verification status:", err);
      toast.error(`Error: ${err.message || "Falló la actualización del estado de verificación."}`);
    }
  };

  // Efecto para la carga inicial y la suscripción a Pusher
  useEffect(() => {
    fetchVerifications(); // Carga inicial de verificaciones

    // Asegurarse de que pusherClient está definido y configurado
    if (!pusherClient) {
        console.error("Pusher client is not initialized. Check '@/lib/pusher'.");
        return;
    }

    pusherClient.subscribe("admin-verifications"); // Suscribirse al canal de admin

    // Handler para cuando hay una actualización de verificación (desde el backend via Pusher)
    const handler = () => {
      console.log("🔔 Verificación actualizada - recargando lista");
      fetchVerifications(); // Recarga la lista para reflejar los cambios
    };

    pusherClient.bind("admin-verifications-updated", handler); // Enlazar el evento

    // Función de limpieza al desmontar el componente
    return () => {
      pusherClient.unbind("admin-verifications-updated", handler);
      pusherClient.unsubscribe("admin-verifications");
    };
  }, []); // Se ejecuta solo una vez al montar

  // Helper para mostrar el badge de estado
  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    let colorClass = "";
    let displayText = "";
    let icon = null;

    switch (status) {
      case "PENDING":
        colorClass = "bg-yellow-600/20 text-yellow-300";
        displayText = "Pendiente";
        icon = <Clock className="w-4 h-4" />;
        break;
      case "APPROVED":
        colorClass = "bg-green-600/20 text-green-300";
        displayText = "Aprobada";
        icon = <CheckCircle className="w-4 h-4" />;
        break;
      case "REJECTED":
        colorClass = "bg-red-600/20 text-red-300";
        displayText = "Rechazada";
        icon = <XCircle className="w-4 h-4" />;
        break;
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colorClass}`}>
        {icon} {displayText}
      </span>
    );
  };

  // Variantes de animación para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white p-8 font-inter overflow-hidden">
      {/* Fondo con degradado sutil y animado */}
      <div className="absolute inset-0 z-0 opacity-10 animate-pulse-light" style={{
        background: 'radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
      }}></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Título animado */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg"
        >
          Panel de Verificaciones
        </motion.h1>

        {/* Estados de carga, error y sin resultados */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-lg"
          >
            <Loader2 className="animate-spin mb-4 text-green-500" size={48} />
            Cargando verificaciones...
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[300px] text-red-500 text-lg"
          >
            <CircleX size={48} className="mb-4" /> {error}
          </motion.div>
        ) : verifications.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-10 text-gray-400 text-lg"
          >
            No hay verificaciones enviadas en este momento.
          </motion.p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> {/* Grid responsivo para las tarjetas */}
            <AnimatePresence>
              {verifications.map((v) => (
                <motion.div
                  key={v.id}
                  variants={itemVariants} // Aplicar animación a cada tarjeta
                  initial="hidden"
                  animate="visible"
                  exit="hidden" // Para cuando se eliminan de la lista
                  className="border border-gray-700 rounded-2xl p-6 bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-3">
                    <User size={20} className="text-green-400" />
                    <p className="text-lg text-white font-semibold">
                      {v.user?.fullName || "Usuario Desconocido"}
                    </p>
                    {v.user?.email && (
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Mail size={16} /> ({v.user.email})
                      </span>
                    )}
                  </div>

                  {/* Sección de imágenes */}
                  <div className="flex flex-wrap justify-center gap-4 mb-5">
                    {/* Imagen de Documento */}
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-1"><FileText size={16} /> Documento</p>
                      <div
                        className="relative w-48 h-36 rounded-lg overflow-hidden border border-gray-600 shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                        onClick={() => setFullScreenImageUrl(v.documentUrl)}
                      >
                        <Image
                          src={v.documentUrl}
                          alt={`Documento de ${v.user?.fullName || 'usuario'}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                          unoptimized // Si Cloudinary ya optimiza, esto previene doble optimización
                        />
                      </div>
                    </div>

                    {/* Imagen de Selfie */}
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-1"><Camera size={16} /> Selfie</p>
                      <div
                        className="relative w-48 h-36 rounded-lg overflow-hidden border border-gray-600 shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                        onClick={() => setFullScreenImageUrl(v.selfieUrl)}
                      >
                        <Image
                          src={v.selfieUrl}
                          alt={`Selfie de ${v.user?.fullName || 'usuario'}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Estado y Acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Estado:</span>
                      {getStatusBadge(v.status)}
                    </div>
                    {v.status === "PENDING" && ( // Mostrar botones solo si el estado es PENDIENTE
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(v.id, "APPROVED")}
                          className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <CheckCircle2 size={18} /> Aprobar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(v.id, "REJECTED")}
                          className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-md hover:from-red-600 hover:to-rose-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <XCircle size={18} /> Rechazar
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Visor de Imagen a Pantalla Completa (Full Screen Image Viewer) */}
      <AnimatePresence>
        {fullScreenImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1002] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setFullScreenImageUrl(null)} // Cierra al hacer clic en el fondo
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()} // Evita que el clic en la imagen cierre el modal
            >
              <Image
                src={fullScreenImageUrl}
                alt="Imagen en pantalla completa"
                width={1200} // Valor arbitrario, objectFit: 'contain' lo ajustará
                height={800} // Valor arbitrario, objectFit: 'contain' lo ajustará
                style={{ objectFit: 'contain', maxWidth: '95vw', maxHeight: '95vh', width: 'auto', height: 'auto' }} // Ajusta al tamaño de la pantalla
                className="rounded-lg shadow-2xl border border-gray-700"
                unoptimized // Mantener unoptimized si Cloudinary ya optimiza
              />
              <button
                onClick={() => setFullScreenImageUrl(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 backdrop-blur-sm transition-colors z-10"
                aria-label="Cerrar imagen"
              >
                <XCircle size={32} /> {/* Usar XCircle para cerrar el visor */}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ToastContainer - Asegúrate de que solo esté aquí si no está en RootLayout */}
      {/* Si ya lo tienes en app/layout.tsx, puedes eliminar esta línea de aquí */}
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  );
}