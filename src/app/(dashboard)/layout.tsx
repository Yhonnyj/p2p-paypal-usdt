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

  // 🎃 Mostrar íconos solo del 18 al 31 de octubre
  const today = new Date();
  const showHalloweenIcons =
    today.getMonth() === 9 && today.getDate() >= 18 && today.getDate() <= 31;

  return (
    <div className="relative min-h-screen text-white font-inter transition-all duration-700 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* 🌌 Fondo visual */}
      <div
        className="absolute inset-0 z-0 opacity-25 transition-all duration-700"
        style={{
          background:
            "radial-gradient(circle at top left, #34D399, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)",
        }}
      ></div>

      {/* 👻🎃🕸️ Decoraciones flotantes globales */}
      {showHalloweenIcons && (
        <>
          {/* 📍 Lado izquierdo */}
          <div className="absolute top-1/4 left-4 text-5xl float-emoji opacity-90">🎃</div>
          <div className="absolute bottom-1/4 left-6 text-5xl float-emoji-slow opacity-85">👻</div>
          <div className="absolute bottom-8 left-12 text-6xl opacity-60 rotate-180">🕸️</div>
          <div className="absolute top-8 left-10 text-6xl opacity-60 rotate-12">🕸️</div>

          {/* 📍 Lado derecho */}
          <div className="absolute top-1/3 right-10 text-5xl float-emoji-slow opacity-85">🎃</div>
          <div className="absolute bottom-12 right-8 text-5xl float-emoji opacity-90">👻</div>
          <div className="absolute bottom-0 right-4 text-6xl opacity-60 -rotate-180">🕸️</div>
          <div className="absolute top-4 right-12 text-6xl opacity-50 -rotate-12">🕸️</div>

          {/* 📍 Inferior centro */}
          <div className="absolute bottom-4 left-1/3 text-4xl opacity-70 float-emoji">🎃</div>
          <div className="absolute bottom-4 right-1/3 text-4xl opacity-70 float-emoji">🎃</div>
        </>
      )}

      {/* Estructura principal */}
      <div className="flex flex-col md:flex-row relative z-10 min-h-screen">
        {/* Sidebar */}
        <div className="md:sticky md:top-0 md:h-screen w-64 z-40">
          <UserSidebar />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={2000} />

      {/* ✅ Animaciones globales */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-20px) rotate(-2deg); }
        }
        .float-emoji {
          animation: float 6s ease-in-out infinite;
        }
        .float-emoji-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
