"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BadgeCheck, Banknote, Clock, PlusCircle, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";

const links = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/dashboard/orders", icon: Clock, label: "Mis Ordenes" },
  { href: "/dashboard/wallet", icon: BadgeCheck, label: "Mis Cuentas" },
  { href: "/dashboard/refers", icon: Banknote, label: "Referidos (PRONTO)" },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <aside className="h-screen w-64 bg-gray-900 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">📊 Mi Panel</h2>

      {/* Botón destacado */}
      <Link
        href="/dashboard/neworder"
        className="flex items-center gap-3 px-4 py-2 mb-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow transition"
      >
        <PlusCircle size={20} />
        <span>Nueva Transaccion</span>
      </Link>

      <nav className="flex flex-col gap-3 flex-grow">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition ${
              pathname === href ? "bg-gray-800" : ""
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Cierre de sesión */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
      >
        <LogOut size={20} />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}
