"use client";

import { ArrowRight } from "lucide-react";
import { useOrderForm } from "@/context/OrderFormContext";
import { OrderFormProvider } from "@/context/OrderFormContext"; // Asegúrate de que el path sea correcto
import PlatformSelector from "@/components/neworders/PlatformSelector";
import DestinationSelector from "@/components/neworders/DestinationSelector";
import USDTFields from "@/components/neworders/USDTFields";
import FiatFields from "@/components/neworders/FiatFields";
import SummaryCard from "@/components/neworders/SummaryCard";
import AlertModal from "@/components/neworders/AlertModal";

function PedidoFormContent() {
  const form = useOrderForm();

  const handleResetCampos = () => {
    form.setWallet("");
    form.setNetwork("TRC20");
    form.setBankName("");
    form.setBsPhoneNumber("");
    form.setBsIdNumber("");
  };

  return (
    <div className="flex-1 text-white font-inter flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-gray-700 bg-gray-900/80 shadow-2xl backdrop-blur-xl p-8 relative overflow-hidden">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
          Nuevo Pedido
        </h1>

        <div className="space-y-6">
          <PlatformSelector />
          <DestinationSelector onReset={handleResetCampos} />

          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Correo de PayPal</label>
            <input
              type="email"
              value={form.paypalEmail}
              onChange={(e) => form.setPaypalEmail(e.target.value)}
              placeholder="cliente@paypal.com"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white"
            />
          </div>

          {form.selectedDestinationCurrency === "USDT" ? <USDTFields /> : <FiatFields />}

          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Monto a enviar (USD)</label>
            <input
              type="number"
              value={form.monto}
              onChange={(e) => form.setMonto(Number(e.target.value))}
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white"
            />
          </div>

          <SummaryCard />

          <button
            onClick={form.handleCrearOrden}
            disabled={form.loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-xl bg-green-600 hover:bg-green-700 text-white transition-colors duration-300"
          >
            {form.loading ? (
              "Creando..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continuar <ArrowRight size={22} />
              </span>
            )}
          </button>
        </div>
      </div>

      <AlertModal />
    </div>
  );
}

export default function NuevoPedidoPage() {
  return (
    <OrderFormProvider>
      <PedidoFormContent />
    </OrderFormProvider>
  );
}
