"use client";

import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevoPedidoPage() {
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const porcentajeComision = 13;
  const montoRecibido = (monto) * (1 - porcentajeComision / 100);

  const handleCrearOrden = async () => {
    if (!paypalEmail || !wallet) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "PayPal",
          destination: `USDT - ${network}`,
          amount: monto,
          paypalEmail,
          wallet,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard/orders");
      } else {
        alert("Error: " + data.error);
        console.error(data);
      }
    } catch (err) {
      console.error("Error al crear la orden:", err);
      alert("Error al crear la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-gray-800 bg-gray-900/80 shadow-2xl backdrop-blur-md p-6">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-green-400 flex items-center justify-center gap-3">
          <Zap className="animate-pulse text-yellow-400" size={32} />
          Nuevo Pedido
        </h1>

        <div className="space-y-2">
          {/* Plataforma y destino */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Plataforma</label>
              <div className="bg-gray-800 rounded-xl px-4 py-3 text-center font-semibold border border-gray-700">PayPal</div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Destino</label>
              <div className="bg-gray-800 rounded-xl px-4 py-3 text-center font-semibold border border-gray-700">USDT</div>
            </div>
          </div>

          {/* Correo PayPal */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Correo de PayPal</label>
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="cliente@paypal.com"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Red USDT */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Red para recibir USDT</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="TRC20">TRC20 (Tron)</option>
              <option value="BEP20">BNB Smart Chain (BEP20)</option>
              <option value="ARBITRUM">Arbitrum One</option>
              <option value="BINANCE_PAY">Binance Pay</option>
            </select>
          </div>

          {/* Wallet o ID según red */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {network === "BINANCE_PAY" ? "User ID de Binance Pay" : "Wallet USDT"}
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder={
                network === "BINANCE_PAY"
                  ? "Ej: 123456789"
                  : network === "TRC20"
                  ? "Ej: TNdzfERDpxLDS2w1..."
                  : "Ej: 0x4499AD..."
              }
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Monto a enviar (USD)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: 100"
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-800 rounded-2xl px-6 py-5 text-sm border border-gray-700 shadow-inner">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Cotización del día</span>
              <span className="text-red-400 font-semibold">1.13</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Usted recibirá</span>
              <span className="text-green-400 text-xl font-bold">{montoRecibido.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Botón */}
          <button
            onClick={handleCrearOrden}
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? "Creando..." : "Continuar"} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
