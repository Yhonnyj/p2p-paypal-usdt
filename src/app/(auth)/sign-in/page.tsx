// app/(public)/sign-in/page.tsx
'use client'; // <-- Este componente necesita ser un Cliente Component debido a Clerk y Framer Motion

import { SignIn } from "@clerk/nextjs";
import { motion } from 'framer-motion'; // Importamos motion para las animaciones

export default function SignInPage() {
  // Variantes para animación de entrada del formulario
  const signInFormVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo con degradado y formas sutiles para un efecto premium */}
      {/* Estas animaciones deben estar definidas en tu globals.css */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0"></div>
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 z-0"></div>

      {/* Contenedor principal del contenido, con un z-index superior al fondo */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto">
        {/* Título de bienvenida impactante */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-tight mb-4 drop-shadow-md"
        >
          Bienvenido de nuevo
        </motion.h1>

        {/* Pequeña descripción */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl font-light text-gray-300 mb-8 max-w-md"
        >
          Accede a tu cuenta y continúa con tus transacciones P2P.
        </motion.p>

        {/* El componente SignIn de Clerk envuelto en motion.div */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={signInFormVariants}
          className="w-full max-w-md bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-2xl border border-gray-700" // Estilo para el contenedor del formulario de Clerk
        >
          <SignIn afterSignInUrl="/dashboard" />
        </motion.div>
      </section>
    </main>
  );
}