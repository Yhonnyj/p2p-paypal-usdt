// components/AdminSidebar.tsx
'use client';

import React, { useState, useEffect } from "react"; // Importar React explícitamente y hooks
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut, ShieldCheck, BellRing } from "lucide-react"; // Añadido BellRing para la notificación en el icono
import { useClerk } from "@clerk/clerk-react";
import { motion, } from "framer-motion"; // Importar Framer Motion
import Image from 'next/image'; // Importar Image para el logo


// Definición de enlaces del sidebar
const links = [
  { href: "/admin/orders", label: "Órdenes", icon: LayoutDashboard },
  { href: "/admin/rates", label: "Cotizaciones", icon: Settings },
  { href: "/admin/verifications", label: "Verificación", icon: ShieldCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const [pendingVerifications, setPendingVerifications] = useState(0);

  // Simulación de carga de verificaciones pendientes.
  // En una aplicación real, esto sería un fetch a tu API.
  useEffect(() => {
    // Aquí iría tu lógica para obtener el número real de verificaciones pendientes
    // Por ejemplo: fetch('/api/admin/pending-verifications').then(res => res.json()).then(data => setPendingVerifications(data.count));
    setPendingVerifications(3); // Simulado: 3 verificaciones pendientes
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login"); // Redirige a la página de login del admin
  };

  // Variantes de animación para los ítems del menú (aparición escalonada)
  const itemVariants = {
    hidden: { opacity: 0, x: -20 }, // Estado inicial oculto y ligeramente a la izquierda
    visible: { opacity: 1, x: 0 }, // Estado visible en su posición final
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-950 text-white border-r border-gray-800 flex flex-col shadow-lg z-40">
      {/* Sección del Logo y Título del Panel de Admin */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} // Animación inicial del título
        animate={{ opacity: 1, y: 0 }}   // Animación al cargar
        transition={{ duration: 0.5 }}
        className="text-center py-6 bg-gray-900 border-b border-gray-800 drop-shadow-lg flex flex-col items-center"
      >
        <Image
          src="/tu-capi-logo.png" // Ruta para el logo de admin (puedes usar el mismo que el de usuario si es adecuado)
          alt="Admin Logo"
          width={80} // Ajusta el tamaño del logo si es necesario
          height={80}
          className="rounded-full shadow-md border border-emerald-500 mb-2"
        />
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg">
          Admin Panel
        </h2>
      </motion.div>

      {/* Sección de Navegación */}
      <nav className="flex-1 px-4 py-6">
        <motion.ul
          initial="hidden" // Estado inicial de la lista
          animate="visible" // Animar a visible
          variants={{
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } // Animación escalonada para los hijos
          }}
          className="space-y-3"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isVerification = href === "/admin/verifications"; // Comprueba si es el enlace de verificaciones

            return (
              <motion.li key={href} variants={itemVariants}> {/* Cada enlace es un elemento de lista animado */}
                <Link
                  href={href}
                  className={`relative flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all duration-200 group overflow-hidden
                    ${isActive
                      ? "bg-gradient-to-r from-emerald-700/40 to-emerald-600/20 text-emerald-300 border-l-4 border-green-500 shadow-sm"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                    }
                  `}
                >
                  {/* Efecto de "halo" al pasar el ratón por encima */}
                  <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10 flex items-center">
                    {/* Renderizado condicional del icono de verificación con badge animado */}
                    {isVerification && pendingVerifications > 0 ? (
                      <motion.div
                        className="relative flex items-center"
                        animate={{
                          scale: [1, 1.1, 1], // Efecto de "pulsación"
                          opacity: [1, 0.8, 1],
                        }}
                        transition={{
                          repeat: Infinity, // Repetir infinitamente
                          duration: 1.5,    // Duración de la animación
                          ease: "easeInOut", // Curva de animación
                        }}
                      >
                        <BellRing className="w-5 h-5 text-red-400" /> {/* Icono de campana para notificación */}
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-red-700 shadow-sm">
                          {pendingVerifications}
                        </span>
                      </motion.div>
                    ) : (
                      // Icono normal para otros enlaces o si no hay verificaciones pendientes
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <span className="relative z-10">{label}</span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>

      {/* Botón de Cerrar Sesión */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Animación inicial del botón
        animate={{ opacity: 1, y: 0 }}   // Animación al cargar
        transition={{ delay: 0.3 }}
        className="p-4 border-t border-gray-800"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 active:scale-98 relative overflow-hidden"
        >
          {/* Efecto de "halo" al pasar el ratón */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <LogOut className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Cerrar sesión</span>
        </button>
      </motion.div>
    </aside>
  );
}