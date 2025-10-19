'use client';

import { SignUp } from "@clerk/nextjs";
import { motion } from 'framer-motion';
import { useReferrer } from "@/lib/useReferrer";

export default function SignUpPage() {
  useReferrer(); // Guarda el referrerId en localStorage

  // 🎃 Detectar si estamos en Halloween (18–31 octubre)
  const today = new Date();
  const isHalloween =
    today.getMonth() === 9 && today.getDate() >= 18 && today.getDate() <= 31;

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

      {/* Contenido */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-4 drop-shadow-md"
        >
          ¡Crea tu cuenta en segundos!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <SignUp
            afterSignUpUrl="/dashboard"
            redirectUrl="/dashboard"
            unsafeMetadata={{
              referrerId:
                typeof window !== "undefined"
                  ? localStorage.getItem("referrerId")
                  : null,
            }}
            appearance={{
              elements: {
                card: "bg-gray-900 border border-gray-800 text-white shadow-lg rounded-xl",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
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
                colorText: "#ffffff",
                colorBackground: "transparent",
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
