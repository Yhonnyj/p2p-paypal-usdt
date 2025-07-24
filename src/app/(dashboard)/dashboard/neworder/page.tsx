"use client";

import { ArrowRight, Mail, DollarSign } from "lucide-react";
import { useOrderForm } from "@/context/OrderFormContext";
import { OrderFormProvider } from "@/context/OrderFormContext";
import PlatformSelector from "@/components/neworders/PlatformSelector";
import DestinationSelector from "@/components/neworders/DestinationSelector";
import USDTFields from "@/components/neworders/USDTFields";
import FiatFields from "@/components/neworders/FiatFields";
import SummaryCard from "@/components/neworders/SummaryCard";
import AlertModal from "@/components/neworders/AlertModal";
import WarningBanner from "@/components/WarningBanner";
import PaypalAccountSelector from "@/components/neworders/PaypalAccountSelector";


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
    <div className="flex-1 text-white font-inter flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl backdrop-blur-2xl p-6 relative overflow-hidden">
        <WarningBanner />

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
          Nuevo Pedido
        </h1>

        <div className="space-y-6">
          <PlatformSelector />
          <DestinationSelector onReset={handleResetCampos} />

        <PaypalAccountSelector />


          {form.selectedDestinationCurrency === "USDT" ? <USDTFields /> : <FiatFields />}

      <div>
  <label className="text-sm text-gray-300 mb-1 block font-medium">Monto a enviar (USD)</label>
  <div className="relative">
    <input
      type="number"
      inputMode="numeric"
      value={form.monto.toString().replace(/^0+(?=\d)/, "")}
      onChange={(e) => {
        const val = e.target.value.replace(/^0+(?=\d)/, "");
        form.setMonto(Number(val));
      }}
      className="w-full px-5 py-3 pl-12 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
  </div>

            <p className="text-sm text-green-400 font-medium mt-3 bg-gray-800 border border-green-600 px-4 py-3 rounded-xl text-center shadow-md">
              En TuCapi no hay sorpresas: <span className="font-semibold">Nosotros cubrimos las comisiones de PayPal.</span><br />
              El monto que quieras cambiar, es el monto que tienes que enviar.
            </p>
          </div>

          <SummaryCard />

          <button
            onClick={form.handleCrearOrden}
            disabled={form.loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-xl text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition duration-300 shadow-lg"
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
