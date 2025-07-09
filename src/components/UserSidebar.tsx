// components/UserSidebar.tsx
'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { toast } from 'react-toastify';

import {
  LayoutDashboard,
  Wallet,
  Banknote,
  Clock,
  LogOut,
  Menu,
  X
} from "lucide-react";

// Definición de los enlaces del sidebar
const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio", functional: true },
  { href: "/dashboard/orders", icon: Clock, label: "Mis Ordenes", functional: true },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mis Cuentas", functional: false }, // No funcional (Próximamente)
  { href: "/dashboard/referred", icon: Banknote, label: "Referidos", functional: true }, // No funcional (Próximamente)
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el sidebar está abierto (en móvil)

  // Efecto para controlar el scroll del cuerpo cuando el sidebar está abierto en móviles.
  // Esto evita que el contenido de fondo se desplace cuando el sidebar está superpuesto.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Deshabilita el scroll del cuerpo
    } else {
      document.body.style.overflow = ''; // Restaura el scroll del cuerpo
    }
    // Función de limpieza que se ejecuta al desmontar el componente o cuando 'isOpen' cambia
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]); // Dependencia en 'isOpen'

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await signOut(); // Llama a la función de cierre de sesión de Clerk
    router.push("/sign-in"); // Redirige al usuario a la página de inicio de sesión
  };

  // Variantes de animación para el sidebar MÓVIL (deslizamiento lateral y opacidad)
  const sidebarMobileVariants = {
    hidden: { x: "-100%", transition: { duration: 0.3, ease: "easeOut" } }, // Oculto fuera de la pantalla
    visible: { x: "0%", transition: { duration: 0.3, ease: "easeOut" } },   // Visible en pantalla
  };

  // Variantes de animación para cada ítem del menú del sidebar (aparición escalonada)
  const itemVariants = {
    hidden: { opacity: 0, x: -20 }, // Estado inicial oculto y ligeramente a la izquierda
    visible: { opacity: 1, x: 0 }, // Estado visible en su posición final
  };

  // Componente interno para renderizar el contenido común del sidebar (logo, enlaces, botón de logout)
  // Esto evita duplicar JSX.
  const renderSidebarContent = () => (
    <>
      {/* Sección del Logo de TuCapi */}
     <div className="flex flex-col items-center">
  <Image
    src="/tu-capi-logo2.png"
    alt="Logo TuCapi"
    width={120}
    height={120}
    className="rounded-full shadow-lg border border-emerald-500 mb-4"
  />

  {/* Imagen con texto TuCapi estilizado */}
  <Image
    src="/tu-capi-texto.png" // Debe estar en /public
    alt="Texto TuCapi"
    width={120}
    height={70}
    className="drop-shadow-md"
  />
</div>


      {/* Sección de Navegación (Enlaces) */}
      <nav className="flex flex-col gap-3 flex-grow">
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } // Animación escalonada para los enlaces
          }}
        >
          {links.map(({ href, icon: Icon, label, functional }) => (

            <motion.li key={href} variants={itemVariants}> {/* Cada enlace es un elemento de lista animado */}
              <Link
                href={functional ? href : "#"} // Redirige si es funcional, usa '#' si no
                className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${pathname === href && functional // Estilos para el enlace activo y funcional
                    ? "bg-gradient-to-r from-green-700/50 to-emerald-600/50 border-l-4 border-green-500 text-green-300 shadow-md transform scale-[1.01]"
                    : functional // Estilos para enlaces funcionales en hover
                      ? "hover:bg-gray-800/60 hover:text-gray-100 transform hover:scale-[1.01] text-gray-300"
                      : "text-gray-500 pointer-events-none opacity-50" // Estilos para enlaces no funcionales (deshabilitados)
                  }
                `}
                onClick={(e) => {
                  if (!functional) {
                    e.preventDefault(); // Evita la navegación si el enlace no es funcional
                    toast.info(`${label} (Próximamente)`); // Muestra una notificación "Próximamente"
                  } else {
                    setIsOpen(false); // Cierra el sidebar en móvil al navegar a un enlace funcional
                  }
                }}
              >
                {/* Efecto visual de "halo" o "luz" al pasar el ratón por encima del enlace */}
                <span className={`absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${pathname === href && functional ? 'opacity-100' : ''}`}></span>
                <Icon
                  size={22}
                  className={`${pathname === href && functional
                      ? "text-green-400" // Color del icono activo
                      : "text-gray-400 group-hover:text-green-400" // Color del icono en hover
                    } transition-colors duration-200 relative z-10`} // Posicionamiento para estar sobre el efecto de luz
                />
                <span className="font-medium text-base relative z-10">
                  {label} {functional ? "" : <span className="text-xs ml-1 opacity-70">(Próximamente)</span>} {/* Texto del enlace con "Próximamente" si aplica */}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </nav>

      {/* Botón de Cerrar Sesión */}
      {/* Animado para aparecer suavemente */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <button
          onClick={handleLogout} // Llama a la función de cierre de sesión
          className="mt-8 w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[#F6C343] to-[#F6C343] hover:from-yellow-400 hover:to-yellow-300 text-white font-bold text-lg shadow-lg shadow-yellow-400/30 transition-all duration-300 transform hover:scale-105 active:scale-98 relative overflow-hidden"

        >
          {/* Efecto visual de "halo" en el botón de cerrar sesión */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <LogOut size={24} className="relative z-10" />
          <span className="relative z-10">Cerrar sesión</span>
        </button>
      </motion.div>
    </>
  );

  return (
    <>
      {/* Overlay oscuro que aparece cuando el sidebar está abierto en móvil. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Botón de hamburguesa/cerrar. Visible solo en dispositivos móviles. */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 p-2 rounded-full border border-emerald-600 shadow-xl text-emerald-400 hover:bg-emerald-900/20 transition-all duration-200"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isOpen ? "x" : "menu"}
            initial={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.div>
        </AnimatePresence>
      </button>

      {/* Sidebar para MÓVIL (fixed y animado). Se renderiza SOLO en pantallas pequeñas. */}
      <AnimatePresence>
        {isOpen && ( // Solo renderizar si 'isOpen' es true para móvil
          <motion.aside
            initial="hidden" // Estado inicial 'hidden' para la animación de entrada
            animate="visible" // Animar a 'visible'
            exit="hidden"     // Animar a 'hidden' al salir
            variants={sidebarMobileVariants} // Aplica las variantes específicas para móvil
            // Estas clases hacen que el sidebar se fije a la izquierda y cubra toda la altura en móvil.
            className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white p-6 flex flex-col border-r border-gray-800 shadow-xl transition-transform duration-300 z-40 md:hidden"
          >
            {renderSidebarContent()} {/* Contenido común */}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar para ESCRITORIO (estático/bloque). Se renderiza SOLO en pantallas grandes. */}
      {/* Este 'aside' es un elemento de bloque normal y respetará el 'w-64' de su padre en layout.tsx */}
      <aside className="hidden md:block h-screen w-64 bg-gray-900 text-white p-6 flex flex-col border-r border-gray-800 shadow-xl relative z-40">
        {renderSidebarContent()} {/* Contenido común */}
      </aside>
    </>
  );
}
