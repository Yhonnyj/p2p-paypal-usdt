"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";

export type AlertType = "success" | "error";

export interface ExchangeRate {
  currency: string;
  rate: number;
}

type PublicChannel = {
  key: string;               // "PAYPAL"
  label: string;             // "PayPal"
  commissionPercent: number; // según side=BUY
  available: boolean;
  displayStatus: string;     // "Disponible" | "No disponible" | "Mantenimiento"
  sortOrder: number;
};

type Milestone = "FIRST" | "FIFTH" | "FIFTEEN_PLUS" | null;

type QuoteResponse = {
  side: "BUY" | "SELL";
  channelKey: string;
  channelLabel: string;
  destinationCurrency: string;
  amountUsd: number;

  // Detalles de comisiones / descuento
  commissionPercent: number;    // % canal
  baseFeePercent: number;       // % base global (si se usa)
  preDiscountPercent: number;   // % antes de descuento (para “Cotización base”)
  userDiscountPercent: number;  // % fidelidad aplicado
  totalPct: number;             // % total aplicado (ya con descuento)

  // Montos resultantes
  netUsd: number;
  exchangeRateUsed: number;     // 1 si USDT, o tasa fiat
  totalInDestination: number;   // netUsd * tasa (si USDT => == netUsd)

  // UX helper
  milestone: Milestone;
};

interface OrderFormContextProps {
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

  // config/rates (para fallback visual)
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

  // opcional config base
  baseFeePercent: number | null;

  // métodos de pago (dinámicos)
  channels: PublicChannel[];
  selectedChannelKey: string | null;
  setSelectedChannelKey: (v: string | null) => void;

  // cotización oficial desde backend
  quote: QuoteResponse | null;
}

const OrderFormContext = createContext<OrderFormContextProps | undefined>(undefined);

export function OrderFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // --------- STATE ---------
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  const [feePercent, setFeePercent] = useState<number | null>(null); // para fallback
  const [baseFeePercent] = useState<number | null>(null);
  const [finalCommission, setFinalCommission] = useState<number | null>(null);

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedDestinationCurrency, setSelectedDestinationCurrency] = useState("USDT");

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
  // Si por algún motivo no hay quote, usamos solo feePercent como % total (sin milestones).
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

  // --------- CARGAR MÉTODOS DINÁMICOS (BUY) ---------
  useEffect(() => {
    let cancelled = false;
    const loadChannels = async () => {
      try {
        const res = await fetch("/api/payment-channels?side=BUY", { cache: "no-store" });
        const data: PublicChannel[] = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          displayAlert((data as any)?.error || "No se pudieron cargar los métodos.");
          return;
        }

        console.log("[channels] BUY ->", data); // 👈 depuración
        setChannels(data);

        // elegir/ajustar el método seleccionado si hace falta
        const firstAvail = data.find((c) => c.available);
        const stillExists = selectedChannelKey
          ? data.some((c) => c.key === selectedChannelKey)
          : false;

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
    // Solo al inicio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  // --------- SINCRONIZAR selectedPlatform CUANDO CAMBIA EL CANAL ---------
  useEffect(() => {
    if (!selectedChannelKey) return;
    const ch = channels.find((c) => c.key === selectedChannelKey);
    if (ch) setSelectedPlatform(ch.label);
  }, [selectedChannelKey, channels]);

  // --------- COTIZAR CADA VEZ QUE CAMBIA ALGO IMPORTANTE ---------
  useEffect(() => {
    let aborted = false;

    const runQuote = async () => {
      // Requiere selección y monto >= 0 (permitimos 0 para preview)
      if (!selectedChannelKey || monto < 0) {
        setQuote(null);
        return;
      }
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side: "BUY",
            channelKey: selectedChannelKey,
            amountUsd: monto,
            destinationCurrency: selectedDestinationCurrency,
            // includeBaseFee: true, // actívalo si usas fee base global
          }),
        });
        const data = await res.json();
        if (!aborted) {
          if (res.ok) {
            setQuote(data as QuoteResponse);
          } else {
            setQuote(null);
            displayAlert(data.error || "No se pudo obtener la cotización.");
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
  }, [selectedChannelKey, monto, selectedDestinationCurrency]);

  // --------- CREAR ORDEN ---------
  const handleCrearOrden = async () => {
    if (!selectedChannelKey) {
      displayAlert("Selecciona un método de pago.");
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
        selectedAccountId,
      };

      if (selectedDestinationCurrency === "BS") {
        (recipientDetails as any).phoneNumber = bsPhoneNumber;
        (recipientDetails as any).idNumber = bsIdNumber;
      }

      if (selectedDestinationCurrency === "COP") {
        (recipientDetails as any).accountNumber = copAccountNumber;
        (recipientDetails as any).accountHolder = copAccountHolder;
      }
    }

    const payload = {
      // legacy
      platform: selectedPlatform,
      // nuevos
      side: "BUY" as const,
      channelKey: selectedChannelKey,
      destinationCurrency: selectedDestinationCurrency,

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
        setFinalCommission(data.finalCommission ?? null); // compat si lo devuelve
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

  // --------- CARGAS INICIALES + PUSHER ---------
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [configRes, ratesRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/rates"),
        ]);

        const [configData, ratesData] = await Promise.all([
          configRes.json(),
          ratesRes.json(),
        ]);

        if (!cancelled) {
          if (configRes.ok) setFeePercent(configData.feePercent);
          if (ratesRes.ok) setExchangeRates(ratesData);
        }
      } catch {
        if (!cancelled) displayAlert("Error de conexión.");
      }
    };

    fetchData();

    const chRates = pusherClient.subscribe("exchange-rates");
    chRates.bind("rates-updated", (data: { rates: ExchangeRate[] }) => {
      setExchangeRates(data.rates);
    });

    const chConfig = pusherClient.subscribe("app-config");
    chConfig.bind("config-updated", (data: { feePercent: number }) => {
      setFeePercent(data.feePercent);
    });

    return () => {
      cancelled = true;
      chRates.unbind_all();
      chRates.unsubscribe();
      chConfig.unbind_all();
      chConfig.unsubscribe();
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
        setSelectedAccountId,

        showAlert,
        alertMessage,
        alertType,
        setShowAlert,
        displayAlert,

        rate,
        montoRecibido,
        handleCrearOrden,
        baseFeePercent,

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
