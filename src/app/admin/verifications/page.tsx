// src/app/admin/verifications/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CircleX,
  CheckCircle,
  XCircle,
  User,
  Mail,
  FileText,
  Camera,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

interface VerificationItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string;
  selfieUrl: string;
  createdAt: string;
  user: {
    email: string;
    fullName: string | null;
  } | null;
}

const PAGE_SIZE = 6;

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVerifications = async (pageNumber = 1, searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/verifications?page=${pageNumber}&limit=${PAGE_SIZE}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Error al cargar las verificaciones."
        );
      }
      const data = await res.json();
      setVerifications(data.verifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Error desconocido al cargar verificaciones.");
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error ||
            `Error al ${
              status === "APPROVED" ? "aprobar" : "rechazar"
            } la verificación.`
        );
      }

      toast.success(
        `Verificación ${id.substring(0, 8)}... ${
          status === "APPROVED" ? "aprobada" : "rechazada"
        } con éxito.`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Falló la actualización del estado de verificación.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchVerifications(page, search);
  }, [page, search]);

  useEffect(() => {
    if (!pusherClient) return;

    pusherClient.subscribe("admin-verifications");
    const handler = () => fetchVerifications(page, search);

    pusherClient.bind("admin-verifications-updated", handler);

    return () => {
      pusherClient.unbind("admin-verifications-updated", handler);
      pusherClient.unsubscribe("admin-verifications");
    };
  }, [page, search]);

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
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colorClass}`}
      >
        {icon} {displayText}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white p-4 sm:p-6 md:p-8 font-inter overflow-hidden">
      {/* Fondo premium */}
      <div
        className="absolute inset-0 z-0 opacity-10 animate-pulse-light"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}
      ></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Encabezado con buscador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center sm:text-left bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
            Panel de Verificaciones ({total})
          </h1>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-lg">
            <Loader2 className="animate-spin mb-4 text-green-500" size={48} />
            Cargando verificaciones...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 text-lg">
            <CircleX size={48} className="mb-4" /> {error}
          </div>
        ) : verifications.length === 0 ? (
          <p className="text-center mt-10 text-gray-400 text-lg">
            No hay verificaciones enviadas en este momento.
          </p>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {verifications.map((v) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-700 rounded-2xl p-5 bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Info del usuario */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User size={20} className="text-green-400" />
                      <p className="text-lg font-semibold">
                        {v.user?.fullName || "Usuario Desconocido"}
                      </p>
                    </div>
                    {v.user?.email && (
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Mail size={16} /> {v.user.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(v.createdAt).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Imágenes */}
                  <div className="flex gap-4 mb-4 justify-center">
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <FileText size={14} /> Documento
                      </p>
                      <div
                        className="relative w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden border border-gray-600 cursor-pointer hover:scale-105 transition"
                        onClick={() => setFullScreenImageUrl(v.documentUrl)}
                      >
                        <Image
                          src={v.documentUrl}
                          alt={`Documento`}
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <Camera size={14} /> Selfie
                      </p>
                      <div
                        className="relative w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden border border-gray-600 cursor-pointer hover:scale-105 transition"
                        onClick={() => setFullScreenImageUrl(v.selfieUrl)}
                      >
                        <Image
                          src={v.selfieUrl}
                          alt={`Selfie`}
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-800 pt-3">
                    {getStatusBadge(v.status)}
                    {v.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(v.id, "APPROVED")}
                          className="px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => updateStatus(v.id, "REJECTED")}
                          className="px-4 py-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl text-sm font-semibold hover:from-red-600 hover:to-rose-700 transition"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-center mt-6 gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                  page === 1
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="text-gray-300 text-sm">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                  page === totalPages
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Imagen en pantalla completa */}
      <AnimatePresence>
        {fullScreenImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1002] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullScreenImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-full max-h-full"
            >
              <Image
                src={fullScreenImageUrl}
                alt="Imagen"
                width={1200}
                height={800}
                style={{
                  objectFit: "contain",
                  maxWidth: "95vw",
                  maxHeight: "95vh",
                }}
                className="rounded-lg shadow-xl border border-gray-700"
                unoptimized
              />
              <button
                onClick={() => setFullScreenImageUrl(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"
              >
                <XCircle size={32} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        theme="dark"
      />
    </div>
  );
}
