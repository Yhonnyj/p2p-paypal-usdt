"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hideSidebar = pathname === "/admin/login";

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.emailAddresses[0]?.emailAddress;
      if (email !== "info@caibo.ca") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoaded, router]);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-x-hidden font-inter">
      {/* Fondo degradado animado */}
      <div
        className="absolute inset-0 z-0 opacity-10 animate-pulse-light"
        style={{
          background:
            "radial-gradient(circle at top left, #10B981, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}
      />

      {/* Contenedor principal sobre fondo */}
      <div className="relative z-10 flex min-h-screen">
        {!hideSidebar && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}

        <main className="flex-1 p-4 md:p-6">
          {!hideSidebar && (
            <div className="md:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-white bg-gray-800 px-4 py-2 rounded shadow hover:bg-gray-700"
              >
                Menú
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
