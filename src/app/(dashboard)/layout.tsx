import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UserSidebar from "@/components/UserSidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-inter">
      {/* Fondo visual */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at top left, #34D399, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
        }}
      ></div>

      {/* Estructura principal en columnas */}
      <div className="flex flex-col md:flex-row relative z-10 min-h-screen">
        {/* Sidebar */}
        <div className="md:sticky md:top-0 md:h-screen w-64 z-40">
          <UserSidebar />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Toast para notificaciones */}
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}
