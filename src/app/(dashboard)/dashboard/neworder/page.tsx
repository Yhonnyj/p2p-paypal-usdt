"use client";

import { useRef } from "react";
import { ArrowRight, DollarSign } from "lucide-react";
import { OrderFormProvider, useOrderForm } from "@/context/OrderFormContext";
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

  // refs para guardar cuentas/wallets antes de crear la orden
  const fiatRef = useRef<{ saveFiatAccount: () => Promise<void> } | null>(null);
  const usdtRef = useRef<{ saveUSDTWallet: () => Promise<void> } | null>(null);

  const handleResetCampos = () => {
    // USDT
    form.setWallet("");
    form.setNetwork("TRC20");

    // FIAT genérico
    form.setBankName("");
    form.setSelectedAccountId(null);

    // FIAT BS
    form.setBsPhoneNumber("");
    form.setBsIdNumber("");

    // FIAT COP
    form.setCopAccountNumber("");
    form.setCopAccountHolder("");
  };

  const handleContinuar = async () => {
    // Guarda datos persistentes del destino antes de crear la orden
    if (form.selectedDestinationCurrency !== "USDT" && fiatRef.current) {
      await fiatRef.current.saveFiatAccount();
    }
    if (form.selectedDestinationCurrency === "USDT" && usdtRef.current) {
      await usdtRef.current.saveUSDTWallet();
    }
    await form.handleCrearOrden();
  };

  const isPayPal = form.selectedChannelKey === "PAYPAL";

  // Validación previa para habilitar el botón
  const hasMonto = Number.isFinite(form.monto) && form.monto > 0;

  const baseFiatOk = form.bankName.trim().length > 0 || !!form.selectedAccountId;

  const fiatOk =
    form.selectedDestinationCurrency === "BS"
      ? baseFiatOk && form.bsPhoneNumber.trim() !== "" && form.bsIdNumber.trim() !== ""
      : form.selectedDestinationCurrency === "COP"
      ? baseFiatOk && form.copAccountNumber.trim() !== "" && form.copAccountHolder.trim() !== ""
      : baseFiatOk; // otras monedas FIAT: solo cuenta/banco

  const destOk =
    form.selectedDestinationCurrency === "USDT"
      ? form.wallet.trim().length > 0
      : fiatOk;

  const paypalOk = !isPayPal || (isPayPal && form.paypalEmail.trim().length > 0);

  const canContinue =
    !form.loading &&
    form.selectedChannelKey !== null &&
    hasMonto &&
    destOk &&
    paypalOk;

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

          {/* Solo mostrar selector de PayPal si el canal actual es PAYPAL */}
          {isPayPal && <PaypalAccountSelector />}

          {form.selectedDestinationCurrency === "USDT" ? (
            <USDTFields ref={usdtRef} />
          ) : (
            <FiatFields ref={fiatRef} />
          )}

          <div>
  <label className="text-sm text-gray-300 mb-1 block font-medium">
    Monto a enviar (USD)
  </label>
  <div className="relative">
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step="0.01"
      value={
        Number.isFinite(form.monto)
          ? String(form.monto).replace(/^0+(?=\d)/, "")
          : ""
      }
      onChange={(e) => {
        const val = e.target.value.replace(/^0+(?=\d)/, "");
        const n = Number(val);
        form.setMonto(Number.isFinite(n) && n >= 0 ? n : 0);
      }}
      className="w-full px-5 py-3 pl-12 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
    <DollarSign
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      size={18}
      aria-hidden
    />
  </div>

  {/* ⚠️ Aviso de monto mínimo */}
  <p className="mt-2 text-sm font-semibold text-red-400 text-center">
    ¡Monto mínimo 2 USD!
  </p>

  <p className="text-sm text-green-400 font-medium mt-3 bg-gray-800 border border-green-600 px-4 py-3 rounded-xl text-center shadow-md">
    En TuCapi no hay sorpresas:{" "}
    <span className="font-semibold">Nosotros cubrimos las comisiones de PayPal.</span>
    <br />
    El monto que quieras cambiar, es el monto que tienes que enviar.
  </p>
</div>


          <SummaryCard />

          <button
            onClick={handleContinuar}
            disabled={!canContinue}
            className={`w-full py-4 px-6 rounded-xl font-bold text-xl text-white shadow-lg transition flex items-center justify-center gap-2 ${
              canContinue
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 cursor-pointer"
                : "bg-emerald-900/40 cursor-not-allowed"
            }`}
          >
            {form.loading ? "Procesando..." : "Continuar"}
            {!form.loading && <ArrowRight size={22} aria-hidden />}
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
