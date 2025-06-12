"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import { motion } from "framer-motion";
// Importa los íconos necesarios de lucide-react
import { ArrowLeft, LifeBuoy, Paperclip, Send } from 'lucide-react'; 


type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    fullName: string | null;
    email: string;
  };
};

type Props = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function OrderChatModal({ orderId, isOpen, onClose }: Props) {
  const { user } = useUser();
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null); // Corregido: HTMLDivElement
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const windowFocusedRef = useRef(true);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      setNewMessage("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-xl h-[80vh] flex flex-col shadow-lg"
      >
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        {/* Header del chat */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 p-1 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-white">Chat de Orden</h2>
          <button className="text-gray-400 hover:text-gray-300 flex items-center gap-1 p-1 rounded-full">
            <LifeBuoy size={20} />
            <span className="text-sm hidden sm:inline">Soporte</span>
          </button>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto space-y-3 px-2 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {messages.map((msg) => {
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
                className={`p-3 rounded-lg shadow-sm transition-colors max-w-[85%] ${
                  isCurrentUser
                    ? "bg-gray-700 ml-auto" // Tus mensajes: gris oscuro, alineados a la derecha
                    : "bg-sky-600 text-white mr-auto" // Otros mensajes: azul claro, alineados a la izquierda
                }`}
              >
                <p className={`text-sm font-medium ${isCurrentUser ? 'text-green-300' : 'text-gray-200'} mb-1`}>
                  {isCurrentUser ? "Tú" : msg.sender.fullName || msg.sender.email}
                </p>
                <p className="text-white text-base">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                </p>
              </motion.div>
            );
          })}
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
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white outline-none focus:ring-2 focus:ring-green-600 pr-10"
            />
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-400">
              <Paperclip size={20} />
            </button>
          </div>
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex-shrink-0"
          >
            <Send size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}