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
  showAlert: boolean;
  alertMessage: string;
  alertType: AlertType;
  setShowAlert: (v: boolean) => void;
  displayAlert: (message: string, type?: AlertType) => void;
  rate: number | null;
  montoRecibido: number;
  handleCrearOrden: () => Promise<void>;
}

const OrderFormContext = createContext<OrderFormContextProps | undefined>(undefined);

export function OrderFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // ✅ MOVIDO AQUÍ
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedDestinationCurrency, setSelectedDestinationCurrency] = useState("USDT");
  const [selectedPlatform, setSelectedPlatform] = useState("PayPal");
  const [bsPhoneNumber, setBsPhoneNumber] = useState("");
  const [bsIdNumber, setBsIdNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("error");

  const rate =
    selectedDestinationCurrency === "USDT"
      ? exchangeRates.find((r) => r.currency === "USD")?.rate ?? 1
      : exchangeRates.find((r) => r.currency === selectedDestinationCurrency)?.rate ?? null;

  const montoRecibido =
    feePercent !== null && rate !== null
      ? selectedDestinationCurrency === "USDT"
        ? monto * (1 - feePercent / 100)
        : monto * (1 - feePercent / 100) * rate
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

    let recipientDetails: {
      type?: string;
      currency?: string;
      wallet?: string;
      network?: string;
      bankName?: string;
      phoneNumber?: string;
      idNumber?: string;
    } = {};

    if (selectedDestinationCurrency === "USDT") {
      if (!wallet) {
        displayAlert("Completa la wallet USDT.");
        return;
      }

      recipientDetails = {
        type: "USDT",
        currency: "USDT",
        wallet,
        network,
      };
    } else {
      if (!bankName) {
        displayAlert("Completa el nombre del banco.");
        return;
      }

      recipientDetails = {
        type: "FIAT",
        currency: selectedDestinationCurrency,
        bankName,
      };

      if (selectedDestinationCurrency === "BS") {
        if (!bsPhoneNumber || !bsIdNumber) {
          displayAlert("Teléfono e ID requeridos para BS.");
          return;
        }

        recipientDetails.phoneNumber = bsPhoneNumber;
        recipientDetails.idNumber = bsIdNumber;
      }
    }

    const payload = {
      platform: selectedPlatform,
      amount: monto,
      paypalEmail,
      recipientDetails,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
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

        const configData = await configRes.json();
        const ratesData = await ratesRes.json();

        if (configRes.ok) setFeePercent(configData.feePercent);
        if (ratesRes.ok) setExchangeRates(ratesData);
        else displayAlert("Error al cargar tasas.");
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
        showAlert,
        alertMessage,
        alertType,
        setShowAlert,
        displayAlert,
        rate,
        montoRecibido,
        handleCrearOrden,
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
