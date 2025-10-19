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

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio", functional: true },
  { href: "/dashboard/orders", icon: Clock, label: "Mis Ordenes", functional: true },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mis Cuentas", functional: true },
  { href: "/dashboard/referred", icon: Banknote, label: "Mis Referidos", functional: false },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const sidebarMobileVariants = {
    hidden: { x: "-100%", transition: { duration: 0.3, ease: "easeOut" } },
    visible: { x: "0%", transition: { duration: 0.3, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const renderSidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center relative z-10">
        <Image
          src="/capistein.png"
          alt="Logo TuCapi"
          width={120}
          height={120}
          className="rounded-full shadow-lg border border-emerald-500 mb-4"
        />
        <Image
          src="/tu-capi-textoh.png"
          alt="Texto TuCapi"
          width={120}
          height={70}
          className="drop-shadow-md"
        />
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-3 flex-grow relative z-10">
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
          }}
        >
          {links.map(({ href, icon: Icon, label, functional }) => (
            <motion.li key={href} variants={itemVariants}>
              <Link
                href={functional ? href : "#"}
                className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${pathname === href && functional
                    ? "bg-gradient-to-r from-green-700/50 to-emerald-600/50 border-l-4 border-green-500 text-green-300 shadow-md transform scale-[1.01]"
                    : functional
                      ? "hover:bg-gray-800/60 hover:text-gray-100 transform hover:scale-[1.01] text-gray-300"
                      : "text-gray-500 pointer-events-none opacity-50"
                  }
                `}
                onClick={(e) => {
                  if (!functional) {
                    e.preventDefault();
                    toast.info(`${label} (Próximamente)`);
                  } else {
                    setIsOpen(false);
                  }
                }}
              >
                <span className={`absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${pathname === href && functional ? 'opacity-100' : ''}`}></span>
                <Icon
                  size={22}
                  className={`${pathname === href && functional
                      ? "text-green-400"
                      : "text-gray-400 group-hover:text-green-400"
                    } transition-colors duration-200 relative z-10`}
                />
                <span className="font-medium text-base relative z-10">
                  {label} {functional ? "" : <span className="text-xs ml-1 opacity-70">(Próximamente)</span>}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </nav>

      {/* Cerrar sesión */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[#F6C343] to-[#F6C343] hover:from-yellow-400 hover:to-yellow-300 text-white font-bold text-lg shadow-lg shadow-yellow-400/30 transition-all duration-300 transform hover:scale-105 active:scale-98 relative overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <LogOut size={24} className="relative z-10" />
          <span className="relative z-10">Cerrar sesión</span>
        </button>
      </motion.div>
    </>
  );

  return (
    <>
      {/* Overlay móvil */}
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

      {/* Botón menú móvil */}
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

      {/* 🎃 Sidebar móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarMobileVariants}
            className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#150C1F] via-[#241134] to-[#000000] text-white p-6 flex flex-col border-r border-gray-800 shadow-2xl transition-transform duration-300 z-40 md:hidden relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#7E3FF2_0%,_transparent_60%)] opacity-20 pointer-events-none"></div>
            {renderSidebarContent()}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 🎃 Sidebar escritorio */}
      <aside className="hidden md:block h-screen w-64 bg-gradient-to-b from-[#150C1F] via-[#241134] to-[#000000] text-white p-6 flex flex-col border-r border-gray-800 shadow-2xl relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#7E3FF2_0%,_transparent_60%)] opacity-20 pointer-events-none"></div>
        {renderSidebarContent()}
      </aside>
    </>
  );
}
