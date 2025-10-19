'use client';

import { SignIn, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_CLERK_IDS = [
  "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH", // 👈 tu ID real
  "user_33WDM3uAde6xgwBlVwOBqV9irvz", // 👈 ID de Alejandro
];

export default function SignInPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 🎃 Detectar si estamos en Halloween (18–31 octubre)
  const today = new Date();
  const isHalloween =
    today.getMonth() === 9 && today.getDate() >= 18 && today.getDate() <= 31;

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      if (ADMIN_CLERK_IDS.includes(user.id)) {
        router.replace("/admin/orders");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center text-white p-6 relative overflow-hidden transition-all duration-700 ${
        isHalloween
          ? "bg-gradient-to-br from-[#2A1040] via-[#3B1460] to-[#000000]"
          : "bg-gray-950"
      }`}
    >
      {/* 🔮 Fondo dinámico */}
      <div
        className={`absolute inset-0 z-0 opacity-25 transition-all duration-700 ${
          isHalloween
            ? "bg-[radial-gradient(circle_at_top_left,_#7E3FF2,_transparent),_radial-gradient(circle_at_bottom_right,_#E35C1F,_transparent)]"
            : "bg-[radial-gradient(circle_at_top_left,_#34D399,_transparent),_radial-gradient(circle_at_bottom_right,_#6366F1,_transparent)]"
        }`}
      />

      {/* 💫 Burbujas decorativas (solo si no es Halloween) */}
      {!isHalloween && (
        <>
          <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 z-0" />
        </>
      )}

      {/* 🎃 Decoraciones Halloween */}
      {isHalloween && (
        <>
          <div className="absolute top-10 left-10 text-6xl opacity-80 animate-bounce">🎃</div>
          <div className="absolute bottom-12 right-12 text-6xl opacity-80 animate-float">👻</div>
          <div className="absolute top-1/2 left-1/4 text-6xl opacity-60 rotate-12">🕸️</div>
        </>
      )}

      <section className="relative z-10 flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-tight mb-4 drop-shadow-md"
        >
          Bienvenido de nuevo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl font-light text-gray-300 mb-8 max-w-md"
        >
          Accede a tu cuenta y continúa con tus transacciones P2P.
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
            appearance={{
              elements: {
                card: "bg-gray-900 border border-gray-800 text-white shadow-lg rounded-xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formFieldInput:
                  "bg-gray-800 text-white placeholder-gray-400 border border-gray-600",
                formButtonPrimary:
                  "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold",
                footer: "hidden",
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

      {/* 🌟 Animaciones */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
