// src/app/pilot/sign-in/[[...index]]/page.tsx
"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PilotSignInPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Si ya está autenticado, lo llevamos directo al formulario del piloto
  useEffect(() => {
    if (!isLoaded) return;
    if (user) router.replace("/pilot/trusted");
  }, [isLoaded, user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo/blur blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 z-0" />

      <section className="relative z-10 flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-tight mb-4 drop-shadow-md"
        >
          Acceso al piloto
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl font-light text-gray-300 mb-8 max-w-md"
        >
          Inicia sesión para continuar con la habilitación de pagos de terceros.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 20 },
            visible: {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="w-full max-w-md rounded-xl"
        >
          <SignIn
            redirectUrl="/pilot/trusted" // 👈 tras login vuelve al formulario del piloto
            appearance={{
              elements: {
                card: "bg-gray-900 border border-gray-800 text-white shadow-lg rounded-xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formFieldInput:
                  "bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:ring-emerald-400",
                formButtonPrimary:
                  "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold",
                footer: "hidden", // oculta registro/links extra
                socialButtonsBlockButton: "bg-gray-800 text-white",
                dividerLine: "bg-gray-700",
              },
              variables: {
                colorPrimary: "#10b981",
                colorBackground: "transparent",
                colorText: "#ffffff",
              },
            }}
          />
        </motion.div>
      </section>
    </main>
  );
}
