"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";

export type AlertType = "success" | "error";

export interface ExchangeRate {
  currency: string;
  rate: number;
}

interface OrderFormContextProps {
  monto: number;
  setMonto: (v: number) => void;
  paypalEmail: string;
  setPaypalEmail: (v: string) => void;
  network: string;
  setNetwork: (v: string) => void;
  wallet: string;
  setWallet: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  feePercent: number | null;
  finalCommission: number | null;
  dynamicCommission: number | null;
  exchangeRates: ExchangeRate[];
  selectedDestinationCurrency: string;
  setSelectedDestinationCurrency: (v: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (v: string) => void;
  bsPhoneNumber: string;
  setBsPhoneNumber: (v: string) => void;
  bsIdNumber: string;
  setBsIdNumber: (v: string) => void;
  bankName: string;
  setBankName: (v: string) => void;
  copAccountNumber: string;
  setCopAccountNumber: (v: string) => void;
  copAccountHolder: string;
  setCopAccountHolder: (v: string) => void;
  selectedAccountId: string | null; // ✅ Nuevo
  setSelectedAccountId: (v: string | null) => void; // ✅ Nuevo
  showAlert: boolean;
  alertMessage: string;
  alertType: AlertType;
  setShowAlert: (v: boolean) => void;
  displayAlert: (message: string, type?: AlertType) => void;
  rate: number | null;
  montoRecibido: number;
  handleCrearOrden: () => Promise<void>;
  baseFeePercent: number | null;
  orderCount: number | null;
}

const OrderFormContext = createContext<OrderFormContextProps | undefined>(undefined);

export function OrderFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [baseFeePercent] = useState<number | null>(null);
  const [finalCommission, setFinalCommission] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedDestinationCurrency, setSelectedDestinationCurrency] = useState("USDT");
  const [selectedPlatform, setSelectedPlatform] = useState("PayPal");
  const [bsPhoneNumber, setBsPhoneNumber] = useState("");
  const [bsIdNumber, setBsIdNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [copAccountNumber, setCopAccountNumber] = useState("");
  const [copAccountHolder, setCopAccountHolder] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null); // ✅ Nuevo
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("error");

  const rate =
    selectedDestinationCurrency === "USDT"
      ? exchangeRates.find((r) => r.currency === "USD")?.rate ?? 1
      : exchangeRates.find((r) => r.currency === selectedDestinationCurrency)?.rate ?? null;

  const dynamicCommission =
    typeof finalCommission === "number"
      ? finalCommission
      : feePercent !== null && orderCount !== null
      ? orderCount === 0
        ? feePercent * 0.5
        : orderCount === 4
        ? feePercent * 0.82
        : orderCount >= 14
        ? feePercent * 0.9
        : feePercent
      : null;

  const montoRecibido =
    dynamicCommission !== null && rate !== null
      ? selectedDestinationCurrency === "USDT"
        ? monto * (1 - dynamicCommission / 100)
        : monto * (1 - dynamicCommission / 100) * rate
      : 0;

  const displayAlert = (message: string, type: AlertType = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const handleCrearOrden = async () => {
    if (selectedPlatform !== "PayPal") {
      displayAlert("Solo PayPal está disponible.");
      return;
    }

    if (!paypalEmail) {
      displayAlert("Completa el correo PayPal.");
      return;
    }

    // Guardar cuenta PayPal automáticamente si no existe
    try {
      const methodsRes = await fetch("/api/payment-methods");
      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        const paypalExists = methodsData.some(
    (m: Record<string, unknown>) => 
  (m as { type: string; details: { email?: string } }).type === "PayPal" &&
  (m as { type: string; details: { email?: string } }).details.email === paypalEmail
);

if (!paypalExists) {
  await fetch("/api/payment-methods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "PayPal", details: { email: paypalEmail } }),
  });
  console.log("Cuenta PayPal guardada automáticamente:", paypalEmail);
}
}
} catch (err) {
  console.error("Error guardando cuenta PayPal:", err);
}

let recipientDetails: Record<string, unknown> = {};


    if (selectedDestinationCurrency === "USDT") {
      if (!wallet) {
        displayAlert("Completa la wallet USDT.");
        return;
      }
      recipientDetails = { type: "USDT", currency: "USDT", wallet, network };
    } else {
      if (!bankName && !selectedAccountId) {
        displayAlert("Selecciona una cuenta bancaria.");
        return;
      }
      recipientDetails = {
        type: "FIAT",
        currency: selectedDestinationCurrency,
        bankName,
        selectedAccountId, // ✅ Incluimos el ID seleccionado
      };

      if (selectedDestinationCurrency === "BS") {
        recipientDetails.phoneNumber = bsPhoneNumber;
        recipientDetails.idNumber = bsIdNumber;
      }

      if (selectedDestinationCurrency === "COP") {
        recipientDetails.accountNumber = copAccountNumber;
        recipientDetails.accountHolder = copAccountHolder;
      }
    }

    const payload = { platform: selectedPlatform, amount: monto, paypalEmail, recipientDetails };
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setFinalCommission(data.finalCommission ?? null);
        router.push(`/dashboard/orders?chat=open&id=${data.id}`);
        return;
      } else {
        displayAlert("Error: " + (data.error || "Algo salió mal."), "error");
      }
    } catch (err) {
      console.error("❌ Error al crear orden:", err);
      displayAlert("Error al crear la orden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configRes = await fetch("/api/config");
        const ratesRes = await fetch("/api/rates");
        const orderCountRes = await fetch("/api/orders/count");
        const configData = await configRes.json();
        const ratesData = await ratesRes.json();
        const orderCountData = await orderCountRes.json();
        if (configRes.ok) setFeePercent(configData.feePercent);
        if (ratesRes.ok) setExchangeRates(ratesData);
        if (orderCountRes.ok) setOrderCount(orderCountData.count);
        else displayAlert("Error al obtener cantidad de órdenes.");
      } catch {
        displayAlert("Error de conexión.");
      }
    };
    fetchData();
    const channel1 = pusherClient.subscribe("exchange-rates");
    channel1.bind("rates-updated", (data: { rates: ExchangeRate[] }) => {
      setExchangeRates(data.rates);
    });
    const channel2 = pusherClient.subscribe("app-config");
    channel2.bind("config-updated", (data: { feePercent: number }) => {
      setFeePercent(data.feePercent);
    });
    return () => {
      channel1.unbind_all();
      channel1.unsubscribe();
      channel2.unbind_all();
      channel2.unsubscribe();
    };
  }, []);

  return (
    <OrderFormContext.Provider
      value={{
        monto,
        setMonto,
        paypalEmail,
        setPaypalEmail,
        network,
        setNetwork,
        wallet,
        setWallet,
        loading,
        setLoading,
        feePercent,
        finalCommission,
        dynamicCommission,
        exchangeRates,
        selectedDestinationCurrency,
        setSelectedDestinationCurrency,
        selectedPlatform,
        setSelectedPlatform,
        bsPhoneNumber,
        setBsPhoneNumber,
        bsIdNumber,
        setBsIdNumber,
        bankName,
        setBankName,
        copAccountNumber,
        setCopAccountNumber,
        copAccountHolder,
        setCopAccountHolder,
        selectedAccountId,
        setSelectedAccountId, // ✅
        showAlert,
        alertMessage,
        alertType,
        setShowAlert,
        displayAlert,
        rate,
        montoRecibido,
        handleCrearOrden,
        baseFeePercent,
        orderCount,
      }}
    >
      {children}
    </OrderFormContext.Provider>
  );
}

export function useOrderForm() {
  const context = useContext(OrderFormContext);
  if (!context) throw new Error("useOrderForm debe usarse dentro de <OrderFormProvider>");
  return context;
}
