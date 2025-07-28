"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";
import {
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
  Upload,
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
const MAX_CACHE_PAGES = 3;

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const cache = useRef<{ [key: string]: VerificationItem[] }>({});

  // Debounce para buscador
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Obtener verificaciones
  const fetchVerifications = async (pageNumber = 1, searchQuery = "") => {
    const cacheKey = `${searchQuery}-${pageNumber}`;
    if (cache.current[cacheKey]) {
      setVerifications(cache.current[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/admin/verifications?page=${pageNumber}&limit=${PAGE_SIZE}&search=${encodeURIComponent(
          searchQuery
        )}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Error al cargar las verificaciones.");
      const data = await res.json();

      setVerifications(data.verifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      // Guardar en cache
      cache.current[cacheKey] = data.verifications;
      const keys = Object.keys(cache.current);
      if (keys.length > MAX_CACHE_PAGES) {
        delete cache.current[keys[0]]; // borrar el más viejo
      }

      // Prefetch siguiente página
      if (pageNumber < data.totalPages) {
        const nextKey = `${searchQuery}-${pageNumber + 1}`;
        if (!cache.current[nextKey]) {
          fetch(
            `/api/admin/verifications?page=${pageNumber + 1}&limit=${PAGE_SIZE}&search=${encodeURIComponent(
              searchQuery
            )}`,
            { cache: "no-store" }
          )
            .then((r) => r.json())
            .then((nextData) => {
              cache.current[nextKey] = nextData.verifications;
            })
            .catch(() => {});
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Aprobar/Rechazar
  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );

    try {
      const res = await fetch(`/api/admin/verifications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error al actualizar la verificación.");

      toast.success(
        `Verificación ${id.substring(0, 8)}... ${
          status === "APPROVED" ? "aprobada" : "rechazada"
        } con éxito.`
      );

      const cacheKey = `${debouncedSearch}-${page}`;
      if (cache.current[cacheKey]) {
        cache.current[cacheKey] = cache.current[cacheKey].map((v) =>
          v.id === id ? { ...v, status } : v
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar el estado."
      );
      fetchVerifications(page, debouncedSearch);
    }
  };

  // Eventos iniciales
  useEffect(() => {
    fetchVerifications(page, debouncedSearch);
  }, [page, debouncedSearch]);

  // Pusher para tiempo real
  useEffect(() => {
    if (!pusherClient) return;
    pusherClient.subscribe("admin-verifications");

    const updateHandler = () => {
      cache.current = {};
      fetchVerifications(page, debouncedSearch);
    };

    const newHandler = (newVerification: VerificationItem) => {
      toast.info(
        `Nueva verificación de ${newVerification.user?.fullName || "Usuario desconocido"}`
      );
      if (page === 1) {
        setVerifications((prev) => [newVerification, ...prev].slice(0, PAGE_SIZE));
        setTotal((prev) => prev + 1);
      } else {
        cache.current = {};
        fetchVerifications(page, debouncedSearch);
      }
    };

    pusherClient.bind("admin-verifications-updated", updateHandler);
    pusherClient.bind("verification-created", newHandler);

    return () => {
      pusherClient.unbind("admin-verifications-updated", updateHandler);
      pusherClient.unbind("verification-created", newHandler);
      pusherClient.unsubscribe("admin-verifications");
    };
  }, [page, debouncedSearch]);

  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    const config = {
      PENDING: { color: "bg-yellow-600/20 text-yellow-300", text: "Pendiente", icon: <Clock className="w-4 h-4" /> },
      APPROVED: { color: "bg-green-600/20 text-green-300", text: "Aprobada", icon: <CheckCircle className="w-4 h-4" /> },
      REJECTED: { color: "bg-red-600/20 text-red-300", text: "Rechazada", icon: <XCircle className="w-4 h-4" /> },
    }[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const renderSkeletons = () => (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
        <div key={idx} className="border border-gray-700 rounded-2xl p-5 bg-gray-900 shadow-lg animate-pulse">
          <div className="h-4 w-2/3 bg-gray-700 rounded mb-4"></div>
          <div className="h-3 w-1/2 bg-gray-700 rounded mb-2"></div>
          <div className="h-3 w-1/3 bg-gray-700 rounded mb-4"></div>
          <div className="flex gap-4">
            <div className="w-32 h-24 bg-gray-700 rounded"></div>
            <div className="w-32 h-24 bg-gray-700 rounded"></div>
          </div>
          <div className="mt-4 h-6 w-full bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-950 text-white p-4 sm:p-6 md:p-8 font-inter overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10" style={{
          background: "radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center sm:text-left bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
            Panel de Verificaciones ({total})
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => router.push("/admin/manual-upload")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-semibold shadow-md transition"
            >
              <Upload size={18} /> Subida Manual
            </button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          renderSkeletons()
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 text-lg">
            <CircleX size={48} className="mb-4" /> {error}
          </div>
        ) : verifications.length === 0 ? (
          <p className="text-center mt-10 text-gray-400 text-lg">No hay verificaciones enviadas en este momento.</p>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {verifications.map((v) => (
                <div key={v.id} className="border border-gray-700 rounded-2xl p-5 bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Info del usuario */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User size={20} className="text-green-400" />
                      <p className="text-lg font-semibold">{v.user?.fullName || "Usuario Desconocido"}</p>
                    </div>
                    {v.user?.email && (
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Mail size={16} /> {v.user.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{new Date(v.createdAt).toLocaleDateString("es-VE")}</p>
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
                        <Image src={v.documentUrl} alt="Documento" fill className="object-cover" unoptimized loading="lazy" />
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
                        <Image src={v.selfieUrl} alt="Selfie" fill className="object-cover" unoptimized loading="lazy" />
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
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-center mt-6 gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                  page === 1 ? "bg-gray-700 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="text-gray-300 text-sm">Página {page} de {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                  page === totalPages ? "bg-gray-700 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Imagen en pantalla completa */}
      {fullScreenImageUrl && (
        <div
          className="fixed inset-0 z-[1002] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullScreenImageUrl(null)}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={fullScreenImageUrl}
              alt="Imagen"
              width={1200}
              height={800}
              style={{ objectFit: "contain", maxWidth: "95vw", maxHeight: "95vh" }}
              className="rounded-lg shadow-xl border border-gray-700"
              unoptimized
              loading="lazy"
            />
            <button
              onClick={() => setFullScreenImageUrl(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"
            >
              <XCircle size={32} />
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} theme="dark" />
    </div>
  );
}
