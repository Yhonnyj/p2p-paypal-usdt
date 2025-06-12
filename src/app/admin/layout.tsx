"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const hideSidebar = pathname === "/admin/login";

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.emailAddresses[0]?.emailAddress;
      if (email !== "info@caibo.ca") {
        router.push("/dashboard"); // 🔁 redirige si no es admin
      }
    }
  }, [user, isLoaded, router]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
