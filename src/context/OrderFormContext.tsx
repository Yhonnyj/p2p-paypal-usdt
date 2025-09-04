"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";

export type AlertType = "success" | "error";
type Side = "BUY" | "SELL";

export interface ExchangeRate {
  currency: string;
  rate: number;
}

type PublicChannel = {
  key: string;               // "PAYPAL"
  label: string;             // "PayPal"
  commissionPercent: number; // según side (BUY/SELL)
  available: boolean;
  displayStatus: string;     // "Disponible" | "No disponible" | "Mantenimiento"
  sortOrder: number;
};

type Milestone = "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null;

type QuoteResponse = {
  side: Side;
  channelKey: string;
  channelLabel: string;
  destinationCurrency: string;
  amountUsd: number;

  // Detalles de comisiones / descuento (SIN AppConfig)
  commissionPercent: number;   // % canal (base)
  preDiscountPercent: number;  // igual a commissionPercent
  userDiscountPercent: number; // % fidelidad aplicado (0 en SELL)
  totalPct: number;            // % total aplicado (ya con descuento)

  // Montos resultantes
  netUsd: number;
  exchangeRateUsed: number;    // 1 si USDT, o tasa fiat
  totalInDestination: number;  // netUsd * tasa

  // UX helper
  milestone: Milestone;
};

// Datos que enviamos en la creación de orden (sin any)
type RecipientDetailsInput =
  | {
      type: "USDT";
      currency: "USDT";
      wallet: string;
      network: string;
    }
  | {
      type: "FIAT";
      currency: string; // "BS" | "COP" | etc
      bankName: string;
      selectedAccountId: string | null;
      // Campos opcionales según moneda FIAT
      phoneNumber?: string;   // BS
      idNumber?: string;      // BS
      accountNumber?: string; // COP
      accountHolder?: string; // COP
    };

interface OrderFormContextProps {
  // lado actual (expuesto por si la UI lo necesita)
  side: Side;

  // básicos
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

  // config/rates (fallback visual)
  feePercent: number | null;
  finalCommission: number | null;
  dynamicCommission: number | null; // = feePercent (sin milestones)
  exchangeRates: ExchangeRate[];

  selectedDestinationCurrency: string;
  setSelectedDestinationCurrency: (v: string) => void;

  // compat visual con selector actual
  selectedPlatform: string;
  setSelectedPlatform: (v: string) => void;

  // datos destino fiat/usdt
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
  selectedAccountId: string | null;
  setSelectedAccountId: (v: string | null) => void;

  // alertas
  showAlert: boolean;
  alertMessage: string;
  alertType: AlertType;
  setShowAlert: (v: boolean) => void;
  displayAlert: (message: string, type?: AlertType) => void;

  // cálculos UI
  rate: number | null;
  montoRecibido: number;

  // acciones
  handleCrearOrden: () => Promise<void>;

  // métodos de pago (dinámicos)
  channels: PublicChannel[];
  selectedChannelKey: string | null;
  setSelectedChannelKey: (v: string | null) => void;

  // cotización oficial desde backend
  quote: QuoteResponse | null;
}

const OrderFormContext = createContext<OrderFormContextProps | undefined>(undefined);

export function OrderFormProvider({
  children,
  side = "BUY",
}: {
  children: React.ReactNode;
  side?: Side;
}) {
  const router = useRouter();

  // --------- STATE ---------
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  // fallback visual si NO llega quote; no usamos AppConfig
  const [feePercent] = useState<number | null>(null);
  const [finalCommission, setFinalCommission] = useState<number | null>(null);

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  // BUY por defecto a USDT; SELL a USD
  const [selectedDestinationCurrency, setSelectedDestinationCurrency] = useState(
    side === "SELL" ? "USD" : "USDT"
  );

  // compat visual (label)
  const [selectedPlatform, setSelectedPlatform] = useState("PayPal");

  // datos destino
  const [bsPhoneNumber, setBsPhoneNumber] = useState("");
  const [bsIdNumber, setBsIdNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [copAccountNumber, setCopAccountNumber] = useState("");
  const [copAccountHolder, setCopAccountHolder] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // alertas
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("error");

  // métodos dinámicos
  const [channels, setChannels] = useState<PublicChannel[]>([]);
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null);

  // quote backend-first
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const displayAlert = (message: string, type: AlertType = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  // --------- TIPO DE CAMBIO (rate) ---------
  const localRate = useMemo(() => {
    return selectedDestinationCurrency === "USDT"
      ? exchangeRates.find((r) => r.currency === "USD")?.rate ?? 1
      : exchangeRates.find((r) => r.currency === selectedDestinationCurrency)?.rate ?? null;
  }, [exchangeRates, selectedDestinationCurrency]);

  // Preferimos la tasa de la quote si existe (backend-first)
  const rate = quote ? quote.exchangeRateUsed : localRate;

  // --------- COMMISSION LOCAL (LEGACY SIN COUNT) ---------
  const dynamicCommission = useMemo(() => {
    if (typeof finalCommission === "number") return finalCommission;
    if (feePercent !== null) return feePercent;
    return null;
  }, [finalCommission, feePercent]);

  // --------- MONTO RECIBIDO (preferir backend) ---------
  const montoRecibido = useMemo(() => {
    if (quote) return quote.totalInDestination;
    if (dynamicCommission !== null && rate !== null) {
      return selectedDestinationCurrency === "USDT"
        ? monto * (1 - dynamicCommission / 100)
        : monto * (1 - dynamicCommission / 100) * rate;
    }
    return 0;
  }, [quote, dynamicCommission, rate, selectedDestinationCurrency, monto]);

  // --------- CARGAR MÉTODOS DINÁMICOS por lado ---------
  useEffect(() => {
    let cancelled = false;
    const loadChannels = async () => {
      try {
        const res = await fetch(`/api/payment-channels?side=${side}`, { cache: "no-store" });
        const data: PublicChannel[] | { error: string } = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          displayAlert("error" in data ? data.error : "No se pudieron cargar los métodos.");
          return;
        }

        const list = data as PublicChannel[];
        setChannels(list);

        // elegir/ajustar el método seleccionado si hace falta
        const firstAvail = list.find((c) => c.available);
        const stillExists = selectedChannelKey ? list.some((c) => c.key === selectedChannelKey) : false;

        if (!stillExists) {
          if (firstAvail) {
            setSelectedChannelKey(firstAvail.key);
            setSelectedPlatform(firstAvail.label); // compat UI
          } else {
            setSelectedChannelKey(null);
            setSelectedPlatform("Selecciona");
          }
        }
      } catch {
        if (!cancelled) displayAlert("Error de conexión al cargar métodos.");
      }
    };
    loadChannels();
    return () => {
      cancelled = true;
    };
  }, [side, selectedChannelKey]);

  // Si cambian los canales y el seleccionado ya no existe, re-elige uno válido
  useEffect(() => {
    if (!channels.length) return;

    const exists = selectedChannelKey && channels.some((c) => c.key === selectedChannelKey);
    if (!exists) {
      const firstAvail = channels.find((c) => c.available) || channels[0];
      if (firstAvail) {
        setSelectedChannelKey(firstAvail.key);
        setSelectedPlatform(firstAvail.label);
      }
    }
  }, [channels, selectedChannelKey]);

  // --------- SINCRONIZAR selectedPlatform CUANDO CAMBIA EL CANAL ---------
  useEffect(() => {
    if (!selectedChannelKey) return;
    const ch = channels.find((c) => c.key === selectedChannelKey);
    if (ch) setSelectedPlatform(ch.label);
  }, [selectedChannelKey, channels]);

  // --------- COTIZAR (envía side) ---------
  useEffect(() => {
    let aborted = false;

    const runQuote = async () => {
      if (!selectedChannelKey || monto < 0) {
        setQuote(null);
        return;
      }
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side, // BUY | SELL
            channelKey: selectedChannelKey,
            amountUsd: monto,
            destinationCurrency: selectedDestinationCurrency,
          }),
        });
        const data: QuoteResponse | { error?: string } = await res.json();
        if (!aborted) {
          if (res.ok) {
            setQuote(data as QuoteResponse);
          } else {
            setQuote(null);
            const msg = "error" in data && data.error ? data.error : "No se pudo obtener la cotización.";
            displayAlert(msg);
          }
        }
      } catch {
        if (!aborted) {
          setQuote(null);
          displayAlert("Error de conexión al cotizar.");
        }
      }
    };

    runQuote();
    return () => {
      aborted = true;
    };
  }, [selectedChannelKey, monto, selectedDestinationCurrency, side]);

  // --------- CARGAR TASAS (por lado) + PUSHER ---------
  useEffect(() => {
    let cancelled = false;

    const fetchRates = async () => {
      try {
        const ratesRes = await fetch(`/api/rates?side=${side}`);
        const ratesData: ExchangeRate[] = await ratesRes.json();
        if (!cancelled && ratesRes.ok) setExchangeRates(ratesData);
      } catch {
        if (!cancelled) displayAlert("Error de conexión.");
      }
    };

    fetchRates();

    const chRates = pusherClient.subscribe("exchange-rates");
    chRates.bind("rates-updated", (data: { rates: ExchangeRate[] }) => {
      // Si tu evento no distingue lado, igual preferimos quote > localRate
      setExchangeRates(data.rates);
    });

    return () => {
      cancelled = true;
      chRates.unbind_all();
      chRates.unsubscribe();
    };
  }, [side]);

  // --------- CREAR ORDEN (envía side) ---------
  const handleCrearOrden = async () => {
    if (!selectedChannelKey) {
      displayAlert("Selecciona un método de pago.");
      return;
    }

    // PayPal: exigir correo solo si el canal elegido es PAYPAL
    if (selectedChannelKey === "PAYPAL" && !paypalEmail) {
      displayAlert("Completa el correo PayPal.");
      return;
    }

    // Guardar cuenta PayPal automáticamente si no existe (solo cuando aplica)
    try {
      if (selectedChannelKey === "PAYPAL" && paypalEmail) {
        const methodsRes = await fetch("/api/payment-methods");
        if (methodsRes.ok) {
          const methodsData: Array<{ type: string; details: { email?: string } }> =
            await methodsRes.json();
          const paypalExists = methodsData.some(
            (m) => m.type === "PayPal" && m.details.email === paypalEmail
          );
          if (!paypalExists) {
            await fetch("/api/payment-methods", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "PayPal", details: { email: paypalEmail } }),
            });
          }
        }
      }
    } catch {
      // silencioso para no romper UX
    }

    let recipientDetails: RecipientDetailsInput;

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
      // base para FIAT
      const fiatBase: RecipientDetailsInput = {
        type: "FIAT",
        currency: selectedDestinationCurrency,
        bankName,
        selectedAccountId,
      };

      // completar según moneda
      if (selectedDestinationCurrency === "BS") {
        if (!bsPhoneNumber || !bsIdNumber) {
          displayAlert("Completa teléfono e identificación para BS.");
          return;
        }
        recipientDetails = {
          ...fiatBase,
          phoneNumber: bsPhoneNumber,
          idNumber: bsIdNumber,
        };
      } else if (selectedDestinationCurrency === "COP") {
        recipientDetails = {
          ...fiatBase,
          accountNumber: copAccountNumber,
          accountHolder: copAccountHolder,
        };
      } else {
        recipientDetails = fiatBase;
      }
    }

    const payload = {
      platform: selectedPlatform,
      side, // BUY | SELL
      channelKey: selectedChannelKey,
      destinationCurrency: selectedDestinationCurrency,
      amount: monto,
      paypalEmail: selectedChannelKey === "PAYPAL" ? paypalEmail : undefined,
      recipientDetails,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { id: string; finalCommission?: number; error?: string } = await res.json();
      if (res.ok) {
        if (typeof data.finalCommission === "number") {
          setFinalCommission(data.finalCommission);
        }
        router.push(`/dashboard/orders?chat=open&id=${data.id}`);
      } else {
        displayAlert("Error: " + (data.error || "Algo salió mal."), "error");
      }
    } catch {
      displayAlert("Error al crear la orden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderFormContext.Provider
      value={{
        side,

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
        setSelectedAccountId,

        showAlert,
        alertMessage,
        alertType,
        setShowAlert,
        displayAlert,

        rate,
        montoRecibido,
        handleCrearOrden,

        channels,
        selectedChannelKey,
        setSelectedChannelKey,

        quote,
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
