'use client';

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
  BellRing,
  X,
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const links = [
  { href: "/admin/orders", label: "Órdenes", icon: LayoutDashboard },
  { href: "/admin/rates", label: "Cotizaciones", icon: Settings },
  { href: "/admin/verifications", label: "Verificación", icon: ShieldCheck },
];

export default function AdminSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const [pendingVerifications, setPendingVerifications] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null); // 👈 Referencia al sidebar

  useEffect(() => {
    setPendingVerifications(3);
  }, []);

  // ✅ Cierra el sidebar si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <AnimatePresence>
      {(isOpen || typeof window !== "undefined") && (
        <motion.aside
          ref={sidebarRef} // 👈 Referencia asignada aquí
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed md:relative z-50 bg-gray-950 text-white border-r border-gray-800 shadow-lg min-h-screen w-64 flex flex-col md:flex md:translate-x-0 md:shadow-none ${
            isOpen ? "block" : "hidden md:block"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 md:hidden">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden md:flex flex-col items-center py-6 bg-gray-900 border-b border-gray-800">
            <Image
              src="/tu-capi-logo2.png"
              alt="Admin Logo"
              width={80}
              height={80}
              className="rounded-full shadow-md border border-emerald-500 mb-2"
            />
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Admin Panel
            </h2>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.1 },
                },
              }}
              className="space-y-3"
            >
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                const isVerification = href === "/admin/verifications";

                return (
                  <motion.li key={href} variants={itemVariants}>
                    <Link
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all duration-200 group overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-700/40 to-emerald-600/20 text-emerald-300 border-l-4 border-green-500 shadow-sm"
                          : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                      }`}
                    >
                      <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 flex items-center">
                        {isVerification && pendingVerifications > 0 ? (
                          <motion.div
                            className="relative flex items-center"
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [1, 0.8, 1],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              ease: "easeInOut",
                            }}
                          >
                            <BellRing className="w-5 h-5 text-red-400" />
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-red-700 shadow-sm">
                              {pendingVerifications}
                            </span>
                          </motion.div>
                        ) : (
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-t border-gray-800"
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 active:scale-98 relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <LogOut className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Cerrar sesión</span>
            </button>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
