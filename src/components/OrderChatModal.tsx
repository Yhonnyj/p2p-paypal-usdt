"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import { motion } from "framer-motion";

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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const windowFocusedRef = useRef(true);

  const fetchMessages = async () => {
    const res = await fetch(`/api/orders/${orderId}/messages`);
    const data = await res.json();
    setMessages(data);
  };

  // Escucha foco/blur
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

  // Solicita permiso de notificación
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
          // 🔊 Sonido
          audioRef.current?.play().catch(() => {});

          // 🔔 Notificación
          if (!windowFocusedRef.current && Notification.permission === "granted") {
            new Notification("Nuevo mensaje", {
              body: data.content,
            });
          }
        }

        return [...prev, data];
      });
    });

    return () => {
      pusher.unsubscribe(`order-${orderId}`);
    };
  }, [orderId, isOpen, currentUserEmail]);

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
      // No agregamos el mensaje manualmente porque vendrá por Pusher
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-xl p-6 w-full max-w-xl h-[80vh] flex flex-col"
      >
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Chat de Orden</h2>
          <button onClick={onClose} className="text-red-400 hover:text-red-600">
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-gray-800 p-3 rounded shadow">
              <p className="text-sm text-white">
                <strong>{msg.sender.fullName || msg.sender.email}</strong>
              </p>
              <p className="text-white">{msg.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded bg-gray-800 text-white outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Enviar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
