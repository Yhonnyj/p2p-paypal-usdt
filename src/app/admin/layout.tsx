"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/admin/login";

  return (
    <div className="flex min-h-screen bg-black text-white">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
