"use client";

import WarningBanner from "@/components/WarningBanner";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import VerificationStatusBadge from "@/components/VerificationStatusBadge";
import {
  ShieldCheck,
  CircleAlert,
  CircleX,
  Loader2,
  DollarSign,
  Wallet,
  Repeat2,
  CheckCircle,
  XCircle,
  User as UserIcon,
} from "lucide-react";
import { pusherClient } from "@/lib/pusher";

// Dynamically import VerificationModal and UserProfile
const VerificationModal = dynamic(() => import("@/components/VerificationModal"), {
  ssr: false,
  loading: () => <div className="text-gray-400">Cargando modal de verificación...</div>,
});

const UserProfile = dynamic(() => import("@clerk/nextjs").then(mod => mod.UserProfile), {
  ssr: false,
  loading: () => <div className="text-gray-400">Cargando perfil de usuario...</div>,
});

type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "LOADING";

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("LOADING");

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");

  // ✅ FIX: redirigir desde /sign-in/factor-one si ya hay sesión activa
  useEffect(() => {
    if (user && window.location.pathname === "/sign-in/factor-one") {
      router.replace("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/verifications/status");
        const data = await res.json();

        if (res.ok) {
          setVerificationStatus(data.status);
        } else {
          setVerificationStatus("NONE");
        }
      } catch (e) {
        console.error("Error fetching verification status:", e);
        setVerificationStatus("NONE");
      }
    };

    fetchStatus();

    const channelName = `user-${user.id}-verification`;
    pusherClient.subscribe(channelName);

    const handleUpdate = (data: { status: VerificationStatus }) => {
      console.log("🔄 Verificación actualizada vía Pusher:", data.status);
      setVerificationStatus(data.status);
    };

    pusherClient.bind("verification-updated", handleUpdate);

    return () => {
      pusherClient.unbind("verification-updated", handleUpdate);
      pusherClient.unsubscribe(channelName);
    };
  }, [user?.id]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayAlert = (message: string, type: "success" | "error" = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

if (user === undefined) {
  return (
    <div className="relative min-h-screen text-white font-inter overflow-hidden flex items-center justify-center">
      {/* Logo girando */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <img
          src="/tucapi-logo.png"
          alt="TuCapi Logo"
          className="w-32 h-32 animate-spin-slow"
        />
        <p className="text-sm text-gray-400 mt-4">Cargando acceso seguro...</p>
      </div>
    </div>
  );
}

if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-white font-inter">
      <div className="text-center bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <p className="text-2xl font-bold mb-4 text-red-500">Acceso No Autorizado</p>
        <p className="text-gray-300">Por favor, inicia sesión para acceder a tu panel.</p>
      </div>
    </div>
  );
}

  // Determine icon and text for verification status
  let statusIcon;
  let statusText = "";
  let statusColor = "";
  let statusBg = ""; // FIX: Esta variable ahora se usa.
  switch (verificationStatus) {
    case "APPROVED":
      statusIcon = <ShieldCheck size={28} />;
      statusText = "¡Felicidades!";
      statusColor = "text-green-400";
      statusBg = "bg-green-900/20";
      break;
    case "PENDING":
      statusIcon = <Loader2 size={28} className="animate-spin" />;
      statusText = "Verificación Pendiente";
      statusColor = "text-yellow-400";
      statusBg = "bg-yellow-900/20";
      break;
    case "REJECTED":
      statusIcon = <CircleX size={28} />;
      statusText = "Verificación Rechazada";
      statusColor = "text-red-400";
      statusBg = "bg-red-900/20";
      break;
    case "NONE":
      statusIcon = <CircleAlert size={28} />;
      statusText = "Verificación Requerida";
      statusColor = "text-blue-400";
      statusBg = "bg-blue-900/20";
      break;
    case "LOADING":
    default:
      statusIcon = <Loader2 size={28} className="animate-spin" />;
      statusText = "Cargando estado de verificación...";
      statusColor = "text-gray-400";
      statusBg = "bg-gray-800/60";
      break;
  }

 return (
  <div className="relative min-h-screen text-white p-6 sm:p-8 font-inter overflow-hidden">
  <div className="relative z-10 max-w-5xl mx-auto">
    {/* Top bar for User Profile */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-6">
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          {/* Imagen decorativa Halloween a la izquierda */}
          <img
            src="/capi-vampiro.png"
            alt="Capibara Vampiro"
            className="w-14 sm:w-16 h-auto animate-fade-in-up"
          />
          <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-lg animate-fade-in-up flex items-center gap-2">
            ¡Bienvenido, {user.firstName}!
          </h1>
        </div>
        <WarningBanner />
      </div>


        <div
          className="flex items-center gap-3 bg-gray-800/70 backdrop-blur-md rounded-full px-3 sm:px-5 py-2 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-blue-500/20 animate-fade-in delay-200 cursor-pointer mx-auto sm:mx-0 w-fit"
          onClick={() => setIsProfileModalOpen(true)}
        >
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="User Avatar"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-green-500"
            />
          ) : (
            <UserIcon size={28} className="text-green-500" />
          )}
          <div className="flex flex-col text-xs sm:text-sm leading-tight text-left">
            <span className="font-semibold text-gray-100 truncate max-w-[120px] sm:max-w-[160px]">
              {user.fullName || user.firstName || 'Usuario'}
            </span>
            <span className="text-gray-400 truncate max-w-[120px] sm:max-w-[160px]">
              {user.primaryEmailAddress?.emailAddress || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Status Card */}
      <section
        className={`mb-12 ${statusBg} backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl transition-all duration-300 hover:shadow-green-500/20 animate-fade-in delay-200`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 flex items-center gap-3">
            <span className={`${statusColor}`}>{statusIcon}</span>
            Estado de Verificación
          </h2>
          <VerificationStatusBadge status={verificationStatus} />
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed text-sm sm:text-base">
          {statusText}
          {verificationStatus === 'NONE' && (
            <>
              : Para poder realizar operaciones financieras completas en nuestra plataforma, es
              necesario que completes la verificación de tu identidad. Es un proceso rápido, menos
              de 1 minuto.
            </>
          )}
          {verificationStatus === 'REJECTED' && (
            <>
              : Tu verificación ha sido rechazada. Por favor, revisa tus documentos y vuelve a
              intentarlo o contacta a soporte.
            </>
          )}
          {verificationStatus === 'PENDING' && (
            <>
              : Tu solicitud de verificación está siendo revisada. Te notificaremos una vez que el
              proceso haya finalizado. Agradecemos tu paciencia.
            </>
          )}
          {verificationStatus === 'APPROVED' && (
            <> Ahora tienes acceso completo a todas las funcionalidades de la plataforma.</>
          )}
        </p>
     {(verificationStatus === 'NONE' || verificationStatus === 'REJECTED') && (
  <button
    onClick={() => setIsOpen(true)}
    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300 px-6 py-3 rounded-xl text-white font-bold text-sm sm:text-lg shadow-lg shadow-green-500/30 transform active:scale-98"
  >
    Verificar Identidad
  </button>
)}

{verificationStatus === 'APPROVED' && (
  <div className="flex flex-col items-center">
    <button
      disabled
      className="bg-gray-600 text-gray-300 cursor-not-allowed px-6 py-3 rounded-xl text-white font-bold text-sm sm:text-lg shadow-lg opacity-70"
    >
      Crear Nueva Orden
    </button>
    <div className="mt-8 flex flex-col items-center">
      <img
        src="/images/capi-witch.png"
        alt="Capi Witch"
        className="w-32 h-32 mb-2 object-contain"
      />
      <p className="text-yellow-300 text-sm font-medium text-center">
        🎃 El CapiWitch está preparando nuevas pociones para tus intercambios.<br />
        Cerrado por descanso,<strong> volveremos el lunes a las 12:00 PM con más hechizos y velocidad mágica! 🧹💫</strong>.
      </p>
      <p className="text-gray-400 text-xs mt-2 text-center">
      Gracias por tu comprensión, ¡feliz fin de semana encantado! 🎃✨
      </p>
    </div>
  </div>
)}
</section>
    </div>


    <VerificationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

    {/* Profile Modal */}
    {isProfileModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-[95vw] max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 animate-scale-up-fade-in relative flex flex-col">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors duration-200 z-10"
            aria-label="Cerrar perfil"
          >
            ✖️
          </button>
          <div className="clerk-profile-container flex-grow overflow-y-auto p-0 md:p-6">
            <UserProfile />
          </div>
        </div>
      </div>
    )}

      {/* Custom Alert/Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-sm w-full text-center transform scale-95 opacity-0 animate-scale-up-fade-in">
            {alertType === 'success' ? (
              <CheckCircle className="text-green-500 mx-auto mb-5 animate-bounce-in" size={56} />
            ) : (
              <XCircle className="text-red-500 mx-auto mb-5 animate-bounce-in" size={56} />
            )}
            <p className="text-white text-lg font-semibold mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-up-fade-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-up-fade-in { animation: scale-up-fade-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}
