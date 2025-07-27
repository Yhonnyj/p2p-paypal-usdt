"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";

export default function ReferredPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalGanado, setTotalGanado] = useState(0);
  const [link, setLink] = useState("");

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch("/api/referrals");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al cargar datos");
        } else {
          setReferrals(data.earnings || []);
          setTotalGanado(data.totalGanado || 0);
          setLink(data.link || "");
        }
      } catch {
        setError("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  const copyToClipboard = () => {
    if (!link) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          toast.success("¡Link copiado al portapapeles!", {
            position: "top-center",
            autoClose: 2000,
          });
        })
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const input = document.createElement("input");
    input.value = link;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    toast.success("¡Link copiado al portapapeles!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  if (loading) return <p className="text-center text-gray-400">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-center bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent drop-shadow-md">
        Programa de Referidos
      </h1>

      <p className="mb-2 text-center text-gray-300">Invita a tus amigos con este link:</p>
      <div className="bg-gray-800 p-3 rounded-lg mb-6 flex items-center justify-between gap-2 text-sm sm:text-base break-all shadow-md">
        <span className="text-green-400 flex-1">{link}</span>
        <button
          type="button"
          onClick={copyToClipboard}
          className="p-2 rounded-md bg-gray-700 hover:bg-green-500 hover:text-white transition"
          aria-label="Copiar enlace"
        >
          <Copy size={18} />
        </button>
      </div>

      <p className="mb-2 text-center text-gray-300">Has ganado un total de:</p>
      <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-8 text-center drop-shadow-lg">
        {totalGanado.toFixed(2)} USDT
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-center">Historial de Ganancias</h2>

      {/* Tabla desktop */}
      <div className="hidden sm:block bg-gray-900 rounded-md overflow-hidden shadow-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-left text-gray-300 uppercase text-xs">
            <tr>
              <th className="p-3">Referido</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Monto</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((earning) => (
              <tr
                key={earning.id}
                className="border-t border-gray-800 hover:bg-gray-800/70 transition-colors duration-300"
              >
                <td className="p-3 font-medium">{earning.referredUserId}</td>
                <td className="p-3">{format(new Date(earning.createdAt), "dd/MM/yyyy")}</td>
                <td className="p-3 text-green-400 font-semibold">
                  +{earning.amount} USDT
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Aún no has generado ganancias por referidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards para móviles */}
      <div className="grid gap-4 sm:hidden">
        {referrals.length === 0 ? (
          <div className="text-center text-gray-400 p-4 bg-gray-800 rounded-lg shadow-md">
            Aún no has generado ganancias por referidos.
          </div>
        ) : (
          referrals.map((earning) => (
            <div
              key={earning.id}
              className="bg-gray-900 p-4 rounded-lg shadow-md text-sm hover:scale-[1.01] transition-transform duration-300"
            >
              <p className="text-gray-300">
                <span className="font-semibold text-white">Referido:</span>{" "}
                {earning.referredUserId}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Fecha:</span>{" "}
                {format(new Date(earning.createdAt), "dd/MM/yyyy")}
              </p>
              <p className="text-green-400 font-semibold mt-1">
                +{earning.amount} USDT
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
