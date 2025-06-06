"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";

const links = [
  { href: "/admin/orders", label: "Ordenes", icon: LayoutDashboard },
  { href: "/admin/config", label: "Configuración", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <div className="w-64 min-h-screen bg-gray-950 text-white border-r border-gray-800 flex flex-col">
      <div className="text-center text-2xl font-bold py-6 border-b border-gray-800">
        Admin Panel
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              pathname === href
                ? "bg-gray-800 text-green-400"
                : "hover:bg-gray-800 text-gray-300"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-500 hover:underline"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
