"use client";

// Next.js and Clerk imports (restored for full functionality)
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/clerk-react";

import { LayoutDashboard, Wallet, Banknote, Clock, LogOut } from "lucide-react"; // Removed PlusCircle as the button is removed

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio", functional: true },
  { href: "/dashboard/orders", icon: Clock, label: "Mis Ordenes", functional: true },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mis Cuentas", functional: false }, // Mark as non-functional for now
  { href: "/dashboard/refers", icon: Banknote, label: "Referidos", functional: false }, // Mark as non-functional for now
];

export default function UserSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    // The main aside container receives className from DashboardLayout for fixed positioning and width
    <aside className={`${className} bg-gray-900/90 backdrop-blur-sm text-white p-6 flex flex-col border-r border-gray-800 shadow-xl`}>
      <h2 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg">
        📊 Mi Panel
      </h2>

      {/* Removed the "Nueva Transacción" button as per request */}

      <nav className="flex flex-col gap-4 flex-grow">
        {links.map(({ href, icon: Icon, label, functional }) => (
          <Link
            key={href}
            href={functional ? href : "#"} // Link to # if not functional
            className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 group ${
              pathname === href && functional // Active state only if functional and path matches
                ? "bg-gray-800 border-l-4 border-green-500 text-green-400 shadow-md transform scale-[1.01]"
                : functional
                  ? "hover:bg-gray-800/60 hover:text-gray-100 transform hover:scale-[1.01] text-gray-300" // Interactive if functional
                  : "text-gray-500 pointer-events-none opacity-50" // Visually disabled if not functional
            }`}
            onClick={(e) => {
              if (!functional) {
                e.preventDefault(); // Prevent navigation if not functional
                // Optional: display a "Coming Soon" alert if you have a custom alert system
                console.log(`${label} (Próximamente) - No funcional aún.`);
              }
            }}
          >
            <Icon size={22} className={`${pathname === href && functional ? "text-green-500" : "text-gray-400 group-hover:text-green-400"} transition-colors duration-200`} />
            <span className="font-medium text-base">{label} {functional ? "" : "(Próximamente)"}</span>
          </Link>
        ))}
      </nav>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="mt-8 flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 active:scale-98"
      >
        <LogOut size={24} />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}
