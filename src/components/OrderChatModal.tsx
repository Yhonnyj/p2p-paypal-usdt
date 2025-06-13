"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, LifeBuoy, Paperclip, Send, Info, ChevronDown, Wallet, RefreshCcw, DollarSign,
  CreditCard, Banknote, FileText, CheckCircle2, Star, PhoneCall, User as UserIcon, CircleX
} from 'lucide-react';
import { toast } from 'react-toastify';

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    fullName: string | null;
    email: string;
  };
};

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

type OrderDetails = {
  id: string;
  platform: string;
  to: string;
  amount: number; // Monto en USD
  finalUsd: number;
  finalUsdt: number;
  paypalEmail: string;
  wallet: string; // Puede contener detalles de FIAT en formato JSON
  status: OrderStatus;
  createdAt: string;
  user: {
    email: string;
    fullName: string;
  };
};

type Props = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  orderData: OrderDetails | null; // EL MODAL AHORA RECIBE LA DATA DE LA ORDEN COMO PROP
};

export default function OrderChatModal({ orderId, isOpen, onClose, orderData }: Props) {
  const { user } = useUser();
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Estados para las secciones colapsables
  const [isInfoOpen, setIsInfoOpen] = useState(true); // Abrir por defecto
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const windowFocusedRef = useRef(true);

  // fetchMessages es para el chat, la data de la orden viene por prop
  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/messages`);
    const data = await res.json();
    setMessages(data);
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
    if (typeof window !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    fetchMessages();

    // Configuración de Pusher
    const pusher = new Pusher("22ec033a363891c90b98", {
      cluster: "sa1",
    });

    const channel = pusher.subscribe(`order-${orderId}`);
    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;

        if (data.sender.email !== currentUserEmail) {
          audioRef.current?.play().catch(() => {});
          if (!windowFocusedRef.current && Notification.permission === "granted") {
            new Notification("Nuevo mensaje", { body: data.content });
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
  }, [orderId, isOpen, currentUserEmail, fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      setNewMessage("");
    } else {
      toast.error("Error al enviar el mensaje.");
      console.error("Error sending message:", await res.json());
    }
  };

  if (!isOpen) return null;

  const pricePerUsdt = orderData && orderData.amount && orderData.finalUsdt
    ? (orderData.amount / orderData.finalUsdt)
    : null;
    
  // FIX: Añadido eslint-disable-next-line para `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fiatDetails: any = null;
  if (orderData?.to !== "USDT" && orderData?.wallet) {
    try {
      fiatDetails = JSON.parse(orderData.wallet);
    } catch (e) {
      console.error("Error parsing FIAT wallet details:", e);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl h-[95vh] flex flex-col md:flex-row shadow-2xl border border-gray-700 relative overflow-hidden"
        >
          <audio ref={audioRef} src="/notification.mp3" preload="auto" />

          {/* Botón de cerrar para dispositivos pequeños */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 p-2 rounded-full bg-gray-800 md:hidden z-20"
            aria-label="Cerrar chat"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Columna Izquierda: Información de la Orden */}
          <div className="w-full md:w-1/3 flex flex-col p-4 bg-gray-850 rounded-xl mr-0 md:mr-6 mb-6 md:mb-0 overflow-y-auto custom-scrollbar-thumb">
            {!orderData ? ( // Si orderData no existe, mostrar mensaje de error
              <div className="flex flex-col items-center justify-center h-full text-red-400 text-lg">
                <CircleX className="mb-4" size={32} />
                No se pudieron cargar los detalles de la orden.
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 rounded-md text-white">Volver</button>
              </div>
            ) : (
              <>
                {/* Header y Botón Volver para Desktop */}
                <div className="hidden md:flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                  <button onClick={onClose} className="text-gray-400 hover:text-green-400 p-2 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Detalles de Orden</h2>
                  {/* <LifeBuoy size={24} className="text-gray-400" /> */} {/* Eliminado el icono de soporte sin funcionalidad */}
                </div>

                {/* Sección de estado de la orden */}
                <div className="bg-gray-900 rounded-xl p-4 mb-4 shadow-inner border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-100">Orden de {orderData.user?.fullName || orderData.user?.email}</h3>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <CheckCircle2 size={20} className="text-green-500" />
                      ID: {orderData.id.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Estado: <span className="font-medium text-green-400">{orderData.status === "COMPLETED" ? "Completada" : orderData.status === "PENDING" ? "Pendiente" : "Cancelada"}</span></p>
                </div>

                {/* Detalles de montos */}
                <div className="bg-gray-900 rounded-xl p-4 mb-4 shadow-inner border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Recibiste:</span>
                    <span className="text-green-400 font-bold text-lg">${orderData.finalUsd.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Enviaste:</span>
                    <span className="text-yellow-400 font-bold text-lg">{orderData.amount.toFixed(2)} USDT</span>
                  </div>
                  {pricePerUsdt && (
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Precio por cada USDT:</span>
                      <span>${pricePerUsdt.toFixed(3)} USD</span>
                    </div>
                  )}
                </div>

          

                {/* Sección Información Adicional */}
                <div className="bg-gray-900 rounded-xl p-0 mb-4 shadow-inner border border-gray-700">
                  <button
                    onClick={() => setIsInfoOpen(!isInfoOpen)}
                    className="w-full flex justify-between items-center p-4 text-gray-100 font-semibold hover:bg-gray-700/50 transition-colors rounded-t-xl"
                  >
                    Datos de Pago <ChevronDown className={`${isInfoOpen ? 'rotate-180' : 'rotate-0'} transition-transform duration-200`} size={20} />
                  </button>
                  <AnimatePresence>
                    {isInfoOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 border-t border-gray-800"
                      >
                        <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                          <Info size={16} />ID de la orden: <span className="font-mono text-xs text-gray-300 select-all">{orderData.id}</span>
                        </p>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                          <CreditCard size={16} />PayPal Email: <span className="font-medium text-gray-300">{orderData.paypalEmail}</span>
                        </p>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                          <Wallet size={16} />Destino: <span className="font-medium text-gray-300">{orderData.to}</span>
                        </p>
                        {orderData.to.includes("USDT") ? (
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                            <Wallet size={16} />Wallet USDT: <span className="font-medium text-gray-300 break-all">{orderData.wallet}</span>
                          </p>
                        ) : (
                          fiatDetails && (
                            <>
                              <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                <Banknote size={16} />Banco: <span className="font-medium text-gray-300">{fiatDetails.bankName}</span>
                              </p>
                              {fiatDetails.phoneNumber && (
                                <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                  <PhoneCall size={16} />Teléfono: <span className="font-medium text-gray-300">{fiatDetails.phoneNumber}</span>
                                </p>
                              )}
                              {fiatDetails.idNumber && (
                                <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                  <UserIcon size={16} />Cédula/ID: <span className="font-medium text-gray-300">{fiatDetails.idNumber}</span>
                                </p>
                              )}
                            </>
                          )
                        )}
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                          <FileText size={16} />Plataforma: <span className="font-medium text-gray-300">{orderData.platform}</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
       

                <div className="mt-auto pt-4 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform active:scale-95"
                    >
                        Volver
                    </button>
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha: Chat */}
          <div className="flex-1 flex flex-col p-4 bg-gray-850 rounded-xl relative">
            {/* Header del chat */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              {/* Botón de volver solo para mobile, oculto en desktop */}
              <button onClick={onClose} className="text-gray-400 hover:text-green-400 p-1 rounded-full hidden md:block">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 flex-1 text-center">Chat de Orden</h2>
              {/* <button className="text-gray-400 hover:text-green-400 flex items-center gap-1 p-1 rounded-full">
                <LifeBuoy size={24} />
                <span className="text-sm hidden sm:inline">Soporte</span>
              </button> */} {/* Eliminado el icono de soporte sin funcionalidad */}
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto space-y-3 px-2 py-2 bg-gray-900 rounded-lg border border-gray-800 shadow-inner custom-scrollbar-thumb">
              {messages.length === 0 ? (
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
                          ? {
                              backgroundColor: "#22c55e", // bg-green-600
                              scale: [1, 1.01, 1],
                              transition: {
                                duration: 0.4,
                                ease: "easeInOut",
                                repeat: 1,
                              },
                            }
                          : {}
                      }
                      className={`p-3 rounded-xl shadow-md transition-colors duration-200 max-w-[85%] ${
                        isCurrentUser
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-700 text-gray-100 mr-auto"
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-blue-200' : 'text-green-300'}`}>
                        {isCurrentUser ? "Tú" : msg.sender.fullName || msg.sender.email}
                      </p>
                      <p className="text-base">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Área de entrada de mensaje */}
            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-700">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-green-500 pr-10 shadow-inner"
                />
                <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-400 transition-colors">
                  <Paperclip size={20} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl flex-shrink-0 shadow-lg transition-all duration-200 transform active:scale-95"
                aria-label="Enviar mensaje"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
