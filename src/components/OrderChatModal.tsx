// components/OrderChatModal.tsx
'use client';

import { useOrderForm } from "@/context/OrderFormContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft, Paperclip, Send, Info, Copy, CheckCircle2, Clock,
  XCircle, ShieldUser, User as CircleX, X, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { useChatStore } from "@/store/chatStore";
import { bankOptions } from "@/lib/bankOptions";

/* =======================
   Tipos
======================= */

type Message = {
  id: string;
  content: string | null;
  createdAt: string;
  sender: { fullName: string | null; email: string; id: string };
  imageUrl?: string;
};

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

type OrderDetails = {
  id: string;
  platform: string;                // PayPal | Zelle | ...
  to: string;                      // "USDT - TRC20" | "USDT - BINANCE_PAY" | "BS" | "COP" ...
  amount: number;                  // USD enviado
  finalUsd: number;                // Neto USD (con comisiones/descuentos)
  finalUsdt: number;               // Neto USDT cuando aplique
  exchangeRateUsed?: number;       // Tasa FIAT congelada (si aplica)
  paypalEmail: string;
  wallet: string;                  // En BS: JSON { bankName, phoneNumber, idNumber }
  status: OrderStatus;
  createdAt: string;
  user: { email: string; fullName: string };
  bankName?: string;
};

type Props = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  orderData: OrderDetails | null;
};

/* =======================
   Logos
======================= */

const platformLogos: Record<string, string> = {
  paypal: "/images/paypal.png",
  zelle: "/images/zelle.png",
  usdt: "/images/usdt.png",
  payoneer: "/images/payoneer.png",
  zinli: "/images/zinli.png",
};

const destinationLogos: Record<string, string> = {
  BINANCE_PAY: "/images/binance_pay.png",
  ARBITRUM: "/images/arbitrum.png",
  BEP20: "/images/bep20.png",
  TRC20: "/images/TRC20.png",
  BS: "/images/BS.png",
  COP: "/images/cop.png",
  USDT: "/images/usdt.png",
};

/* =======================
   Helpers
======================= */

const fmtFiatVE = (v: number) =>
  new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtUS = (v: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays <= 2 && date.getDate() === now.getDate() - 1) {
    return `Ayer ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays <= 7) {
    return date.toLocaleDateString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  } else {
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }
};

// obtiene bankName desde campo plano o wallet JSON
function getBankName(order: OrderDetails | null): string | null {
  if (!order) return null;
  if (order.bankName?.trim()) return order.bankName.trim();
  try {
    const data = JSON.parse(order.wallet || "{}");
    if (data?.bankName) return String(data.bankName);
  } catch {}
  return null;
}

/* =======================
   Componente
======================= */

export default function OrderChatModal({ orderId, isOpen, onClose, orderData }: Props) {
  const { user } = useUser();
  const { exchangeRates } = useOrderForm();
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
  const setIsChatModalOpen = useChatStore((s) => s.setIsChatModalOpen);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const [showOrderDetailsMobile, setShowOrderDetailsMobile] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const windowFocusedRef = useRef(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setFetchingMessages(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const { order, messages } = await res.json();
      if (order?.user?.email) setClientEmail(order.user.email);
      setMessages(messages);
    } catch (error) {
      toast.error("Error al cargar mensajes.");
    } finally {
      setFetchingMessages(false);
    }
  }, [orderId]);

  useEffect(() => {
    const handleFocus = () => (windowFocusedRef.current = true);
    const handleBlur = () => (windowFocusedRef.current = false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setNewMessage("");
      setSelectedFile(null);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
      setUploadingImage(false);
      setSendingMessage(false);
      setShowOrderDetailsMobile(false);
      setFullScreenImageUrl(null);
      return;
    }

    fetchMessages();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`order-${orderId}`);

    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;

        if (data.sender.email !== currentUserEmail) {
          audioRef.current?.play().catch(() => {});
          if (typeof Notification !== "undefined" && Notification.permission === "granted" && !windowFocusedRef.current) {
            try {
              new Notification("Nuevo mensaje de TuCapi", {
                body: data.content || "Se ha enviado una imagen.",
                icon: "/tu-capi-logo.png",
              });
            } catch {}
          }
          setHighlightedId(data.id);
          setTimeout(() => setHighlightedId(null), 3000);
        }

        return [...prev, data];
      });
    });

    return () => {
      pusher.unsubscribe(`order-${orderId}`);
    };
  }, [orderId, isOpen, currentUserEmail, fetchMessages, filePreview]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, fetchingMessages, sendingMessage]);

  useEffect(() => {
    setIsChatModalOpen(isOpen);
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (uploadingImage || sendingMessage) return;

    setSendingMessage(true);
    let uploadedImageUrl: string | undefined;

    if (selectedFile) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const uploadResponse = await fetch("/api/upload-image", { method: "POST", body: formData });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Error desconocido al subir la imagen");
        }
        const data = await uploadResponse.json();
        uploadedImageUrl = data.url;
        toast.success("Imagen subida con éxito.");
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(`Error al subir la imagen: ${error.message || "Inténtalo de nuevo."}`);
        setUploadingImage(false);
        setSendingMessage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const messagePayload: Partial<Message> = {
      content: newMessage.trim() || null,
      imageUrl: uploadedImageUrl,
    };
    if (!messagePayload.content && !messagePayload.imageUrl) {
      setSendingMessage(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });

      if (res.ok) {
        setNewMessage("");
        setSelectedFile(null);
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      } else {
        const errorData = await res.json();
        toast.error(`Error al enviar mensaje: ${errorData.error || "Inténtalo de nuevo."}`);
      }
    } catch {
      toast.error("Error de red al enviar el mensaje.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen.");
        e.target.value = "";
        return;
      }
      const MAX_FILE_SIZE_MB = 5;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`La imagen es demasiado grande. Máximo ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  if (!isOpen) return null;

  /* =======================
     Detalles de la orden (columna izquierda / overlay)
  ======================= */
  const renderOrderDetails = () => {
    if (!orderData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 text-lg p-4">
          <CircleX className="mb-4" size={32} />
          No se pudieron cargar los detalles de la orden.
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 rounded-md text-white">
            Volver
          </button>
        </div>
      );
    }

    const pricePerUsdt =
      orderData.amount && orderData.finalUsdt ? orderData.amount / orderData.finalUsdt : null;

    // Monto recibido DIRECTO desde backend (y tasa congelada si es FIAT)
    let currencyLabel = "USDT";
    let montoRecibido: number;

    if (orderData.to.includes("USDT")) {
      currencyLabel = "USDT";
      montoRecibido =
        typeof orderData.finalUsdt === "number" && orderData.finalUsdt > 0
          ? orderData.finalUsdt
          : orderData.finalUsd; // fallback por seguridad
    } else {
      currencyLabel = orderData.to; // "BS", "COP", etc.
      const frozen = typeof orderData.exchangeRateUsed === "number" ? orderData.exchangeRateUsed : null;
      const fallback = exchangeRates.find((r) => r.currency === orderData.to)?.rate ?? 1;
      const rateToUse = frozen ?? fallback;
      montoRecibido = orderData.finalUsd * rateToUse;
    }

    // Logos
    const platformLogo = platformLogos[orderData.platform.toLowerCase()] || "/images/default.png";
    const [mainCurrency, destination] = orderData.to.includes("-")
      ? orderData.to.split("-").map((s) => s.trim())
      : [orderData.to, ""];
    const parsedBankName = getBankName(orderData);

    const handleCopy = (text: string) => {
      try {
        navigator.clipboard.writeText(text);
        toast.success("Copiado");
      } catch {
        toast.error("No se pudo copiar.");
      }
    };

    const isAdminView = orderData.user?.email !== currentUserEmail;

    return (
      <>
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
          <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-emerald-400 p-2 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white flex-1 text-center md:text-left ml-4 md:ml-0">
            Detalles de Orden
          </h2>
          <button
            onClick={() => setShowOrderDetailsMobile(false)}
            className="block md:hidden text-gray-400 hover:text-gray-200 p-2 rounded-full bg-gray-800"
            aria-label="Cerrar detalles"
          >
            <X size={20} />
          </button>
        </div>

        {/* Estado */}
        <div className="bg-gray-900 rounded-xl p-4 mb-4 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-100">
              Orden de: {isAdminView ? orderData.user?.fullName ?? "Tu Capi" : "Tu Capi"}
            </h3>
            <span className="flex items-center gap-1 text-sm font-medium">
              <ShieldUser size={20} className="text-emerald-500" />
            </span>
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            Estado:{" "}
            <span
              className={`flex items-center gap-1 font-medium ${
                orderData.status === "COMPLETED"
                  ? "text-emerald-500"
                  : orderData.status === "PENDING"
                  ? "text-yellow-400"
                  : "text-red-500"
              }`}
            >
              {orderData.status === "COMPLETED" && (<><CheckCircle2 size={16} /> Completada</>)}
              {orderData.status === "PENDING" && (<><Clock size={16} /> Pendiente</>)}
              {orderData.status === "CANCELLED" && (<><XCircle size={16} /> Cancelada</>)}
            </span>
          </p>
        </div>

        {/* Montos */}
        <div className="bg-gray-900 rounded-xl p-4 mb-4 shadow-inner border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Recibiste:</span>
            <span className="text-white font-bold text-lg">
              {currencyLabel === "USDT"
                ? `${fmtUS(montoRecibido)} USDT`
                : `${fmtFiatVE(montoRecibido)} ${currencyLabel}`}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Enviaste:</span>
            <span className="text-white font-bold text-lg">{fmtUS(orderData.amount)} USD</span>
          </div>
          {pricePerUsdt && (
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Precio por USDT:</span>
              <span>{pricePerUsdt.toFixed(4)} USD</span>
            </div>
          )}
        </div>

        {/* Datos de Pago */}
        <div className="bg-gray-900 rounded-xl p-0 mb-4 shadow-inner border border-gray-700">
          <div className="w-full flex justify-between items-center p-4 text-gray-100 font-semibold rounded-t-xl">
            Datos de Pago
          </div>
          <div className="px-4 pb-4 border-t border-gray-800 space-y-3">
            {/* Orden */}
            <p className="text-gray-400 text-sm flex items-center gap-2">
              Orden:
              <span className="font-mono text-xs text-gray-300 select-all">{orderData.id}</span>
              <Copy size={16} className="cursor-pointer text-gray-400 hover:text-green-400" onClick={() => handleCopy(orderData.id)} />
            </p>


{/* Método (email / cuenta del cliente) */}
  <p className="text-gray-400 text-sm flex items-center gap-2">
    Correo:
    <span className="font-medium text-gray-300">{orderData.paypalEmail}</span>
    <Copy
      size={16}
      className="cursor-pointer text-gray-400 hover:text-green-400"
      onClick={() => handleCopy(orderData.paypalEmail)}
    />
  </p>

            {/* Plataforma con logo */}
            <div className="text-gray-400 text-sm flex items-center gap-2">
              Plataforma:
              <span className="flex items-center gap-2 font-medium text-gray-300">
                <Image src={platformLogo} alt={orderData.platform} width={22} height={22} className="rounded-full object-contain" />
                {orderData.platform}
              </span>
            </div>


            {/* Destino con íconos */}
            <div className="text-gray-400 text-sm flex items-center gap-2">
              Destino:
              <span className="flex items-center gap-2 font-medium text-gray-300">
              {orderData.to === "BS" ? (
  <>
    <Image
      src={destinationLogos.BS}
      alt="BS"
      width={22}
      height={22}
      className="rounded-full object-contain"
    />
    <span>Bolívares</span>
  </>
) : (

                  <>
                    {mainCurrency && (
                      <Image
                        src={platformLogos[mainCurrency.toLowerCase()] || destinationLogos.USDT}
                        alt={mainCurrency}
                        width={22}
                        height={22}
                        className="rounded-full object-contain"
                      />
                    )}
                    {destination && <span>→</span>}
                    {destination && (
                      <Image
                        src={destinationLogos[destination] || "/images/default-dest.png"}
                        alt={destination}
                        width={22}
                        height={22}
                        className="rounded-full object-contain"
                      />
                    )}
                  </>
                )}
              </span>
              <Copy size={16} className="cursor-pointer text-gray-400 hover:text-green-400" onClick={() => handleCopy(orderData.to)} />
            </div>

            {/* Wallet o datos FIAT */}
            {orderData.to.includes("USDT") ? (
              <div className="text-gray-400 text-sm flex items-center gap-2">
                Wallet USDT:
                <span className="font-medium text-gray-300 break-all">{orderData.wallet}</span>
                <Copy size={16} className="cursor-pointer text-gray-400 hover:text-green-400" onClick={() => handleCopy(orderData.wallet)} />
              </div>
            ) : (
              (() => {
                try {
                  const parsed = JSON.parse(orderData.wallet || "{}");
                  return (
                    <>
                     <p className="text-gray-400 text-sm flex items-center gap-2">
  Banco:
  {(() => {
    const bn = parsedBankName ?? parsed?.bankName ?? "-";
    const found = bankOptions.find(
      (b) =>
        b.value.toLowerCase() === bn.toLowerCase() ||
        b.label.toLowerCase() === bn.toLowerCase()
    );
    const logo = found?.img || "/images/default-bank.png";

    return (
      <span className="flex items-center gap-2 font-medium text-gray-300">
        <Image
          src={logo}
          alt={bn}
          width={20}
          height={20}
          className="rounded-full object-contain"
        />
        {bn}
      </span>
    );
  })()}
  <Copy
    size={16}
    className="cursor-pointer text-gray-400 hover:text-green-400"
    onClick={() =>
      handleCopy(parsedBankName ?? parsed?.bankName ?? "-")
    }
  />
</p>

                      {parsed?.phoneNumber && (
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                          Teléfono:
                          <span className="font-medium text-gray-300">{parsed.phoneNumber}</span>
                          <Copy size={16} className="cursor-pointer text-gray-400 hover:text-green-400" onClick={() => handleCopy(parsed.phoneNumber)} />
                        </p>
                      )}
                      {parsed?.idNumber && (
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                          Cédula:
                          <span className="font-medium text-gray-300">{parsed.idNumber}</span>
                          <Copy size={16} className="cursor-pointer text-gray-400 hover:text-green-400" onClick={() => handleCopy(parsed.idNumber)} />
                        </p>
                      )}
                    </>
                  );
                } catch {
                  return null;
                }
              })()
            )}
          </div>
        </div>

        {/* Botones volver */}
        <div className="mt-auto pt-4 text-center block md:hidden">
          <button
            onClick={() => {
              setShowOrderDetailsMobile(false);
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform active:scale-95"
          >
            Volver al inicio
          </button>
        </div>
        <div className="mt-auto pt-4 text-center hidden md:block">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-300 text-white rounded-xl font-bold shadow-lg hover:from-green-700 hover:to-yellow-600 transition-all duration-300 transform active:scale-95"
          >
            Volver
          </button>
        </div>
      </>
    );
  };

  /* =======================
     Render principal
  ======================= */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gray-900 rounded-none md:rounded-2xl p-0 md:p-6 w-full max-w-5xl h-full md:h-[95vh] flex flex-col md:flex-row shadow-2xl border border-gray-700 relative overflow-hidden"
        >
          <audio ref={audioRef} src="/notification.mp3" preload="auto" />

          {/* Overlay móvil */}
          <AnimatePresence>
            {showOrderDetailsMobile && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-[55] bg-gray-900 md:hidden flex flex-col p-4 overflow-y-auto custom-scrollbar-thumb"
              >
                {renderOrderDetails()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Columna izquierda (desktop) */}
          <div className="hidden md:flex w-1/3 flex-col p-4 bg-gray-850 rounded-xl mr-6 mb-0 overflow-y-auto custom-scrollbar-thumb">
            {renderOrderDetails()}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col p-4 bg-gray-850 rounded-xl relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <button onClick={onClose} className="text-gray-400 hover:text-green-400 p-1 rounded-full md:hidden">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white flex-1 text-center md:text-left ml-4 md:ml-0">Chat de Orden</h2>
              <button
                onClick={() => setShowOrderDetailsMobile(true)}
                className="text-gray-400 hover:text-green-400 p-1 rounded-full md:hidden"
                aria-label="Ver detalles de la orden"
              >
                <Info size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-2 py-2 bg-gray-900 rounded-lg border border-gray-800 shadow-inner custom-scrollbar-thumb max-h-[60vh] md:max-h-none">
              {fetchingMessages ? (
                <div className="flex flex-col justify-center items-center h-full text-gray-400">
                  <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
                  <p>Cargando mensajes...</p>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">Inicia la conversación para esta orden.</p>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.sender.email === currentUserEmail;
                  const isHighlighted = highlightedId === msg.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={false}
                      animate={
                        isHighlighted
                          ? { backgroundColor: "#22c55e", scale: [1, 1.01, 1], transition: { duration: 0.4, ease: "easeInOut", repeat: 1 } }
                          : {}
                      }
                      className={`p-3 rounded-xl shadow-md transition-colors duration-200 max-w-[85%] ${
                        isCurrentUser ? "bg-emerald-500 to-teal-400 text-white ml-auto" : "bg-gray-700 text-gray-100 mr-auto"
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isCurrentUser ? "text-white" : "text-green-300"}`}>
                        {isCurrentUser ? "Tú" : msg.sender.fullName || msg.sender.email}
                      </p>
                      {msg.content && <p className="text-base text-gray-100">{msg.content}</p>}
                      {msg.imageUrl && (
                        <div
                          className="mt-2 relative w-48 h-48 sm:w-64 sm:h-64 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-[1.02]"
                          onClick={() => setFullScreenImageUrl(msg.imageUrl || null)}
                        >
                          <Image
                            src={msg.imageUrl}
                            alt="Imagen de chat"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            className="rounded-lg"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1 text-right">{formatMessageDate(msg.createdAt)}</p>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {(() => {
              const isSameEmail =
                currentUserEmail &&
                clientEmail &&
                currentUserEmail.toLowerCase().trim() === clientEmail.toLowerCase().trim();

              const shouldShowButton =
                currentUserEmail &&
                clientEmail &&
                orderData?.id &&
                orderData?.status === "PENDING" &&
                isSameEmail &&
                !hasClicked;

              return shouldShowButton ? (
                <div className="mt-4 text-center">
                  <button
                    onClick={async () => {
                      try {
                        setHasClicked(true);
                        const res = await fetch(`/api/orders/${orderData!.id}/confirm-payment`, { method: "POST" });
                        const data = await res.json();
                        if (!res.ok) {
                          setHasClicked(false);
                          alert(data.error || "Error al confirmar el pago");
                        } else {
                          alert("✅ Pago confirmado. Esperando verificación de TuCapi.");
                        }
                      } catch {
                        setHasClicked(false);
                        alert("Ocurrió un error inesperado.");
                      }
                    }}
                    className="inline-block mt-2 px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg shadow-md transition duration-150"
                  >
                    He pagado
                  </button>
                </div>
              ) : null;
            })()}

            {/* Preview archivo */}
            <AnimatePresence>
              {filePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 bg-gray-700 border-t border-gray-600 flex items-center justify-between rounded-b-lg mt-4"
                >
                  <div className="flex items-center space-x-2">
                    <Image src={filePreview} alt="Previsualización" width={60} height={60} className="rounded object-cover" />
                    <span className="text-sm text-gray-300 truncate max-w-[calc(100%-100px)]">{selectedFile?.name}</span>
                  </div>
                  <button onClick={removeFile} className="text-red-400 hover:text-red-300 p-1 rounded-full">
                    <X size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-700 bg-gray-850">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={uploadingImage ? "Subiendo imagen..." : sendingMessage ? "Enviando..." : "Escribe un mensaje..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  disabled={uploadingImage || sendingMessage}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-400 pr-10 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="file-input"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-400 transition-colors cursor-pointer"
                  aria-disabled={uploadingImage || sendingMessage}
                >
                  <Paperclip size={20} />
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploadingImage || sendingMessage}
                  />
                </label>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={uploadingImage || sendingMessage || (!newMessage.trim() && !selectedFile)}
                className="bg-emerald-500 hover:bg-teal-400 text-white p-3 rounded-xl flex-shrink-0 shadow-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
              >
                {uploadingImage || sendingMessage ? (
                  <Loader2 className="animate-spin h-6 w-6 text-white" />
                ) : (
                  <Send size={24} />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Visor imagen full-screen */}
        <AnimatePresence>
          {fullScreenImageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1002] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setFullScreenImageUrl(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gray-900 rounded-none md:rounded-2xl p-0 md:p-6 w-full max-w-5xl h-full md:h-[95vh] flex flex-col md:flex-row shadow-2xl border border-gray-700 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={fullScreenImageUrl}
                  alt="Imagen en pantalla completa"
                  width={1000}
                  height={1000}
                  style={{ objectFit: "contain", maxWidth: "90vw", maxHeight: "90vh", width: "auto", height: "auto" }}
                  className="rounded-lg shadow-2xl border border-gray-700"
                  unoptimized
                />
                <button
                  onClick={() => setFullScreenImageUrl(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 backdrop-blur-sm transition-colors z-10"
                  aria-label="Cerrar imagen"
                >
                  <X size={32} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
