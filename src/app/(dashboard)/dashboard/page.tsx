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
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-inter overflow-hidden flex items-center justify-center">
      {/* Fondo radial */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at top left, #34D399, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
        }}
      ></div>

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-8 text-white font-inter">
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
  <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 sm:p-8 font-inter overflow-hidden">
    {/* Background radial gradient */}
    <div
      className="absolute inset-0 z-0 opacity-20"
      style={{
        background:
          'radial-gradient(circle at top left, #34D399, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
      }}
    ></div>

    <div className="relative z-10 max-w-5xl mx-auto">
      {/* Top bar for User Profile */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-lg animate-fade-in-up">
            ¡Bienvenido, {user.firstName}!
          </h1>
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
        {verificationStatus === 'APPROVED' && (



  <div className="flex flex-col items-center">



    <button



      disabled



      className="bg-gray-600 text-gray-300 cursor-not-allowed px-6 py-3 rounded-xl text-white font-bold text-sm sm:text-lg shadow-lg opacity-70"



    >



      Crear Nueva Orden

</button>



    <div className="mt-4 flex flex-col items-center">



      <img



        src="/images/capi-constructor.png"



        alt="Capi Constructor"



        className="w-24 h-24 mb-2 object-contain"



      />

 <p className="text-yellow-300 text-sm font-medium text-center">
  🛠 Tu Capibara favorito está descansando. Volvemos mañana lunes a partir de las 10:00 AM.
</p>


</div>



  </div>



)}



</section>



      

      {/* Key Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 animate-fade-in delay-400">
        <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-5 border border-gray-700 shadow-lg text-center transition-all duration-300 hover:scale-105 hover:border-blue-500/50">
          <DollarSign size={36} className="text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-100">
            Transacciones Seguras
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Tu seguridad es nuestra prioridad. Todas tus operaciones están protegidas.
          </p>
        </div>
        <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-5 border border-gray-700 shadow-lg text-center transition-all duration-300 hover:scale-105 hover:border-purple-500/50">
          <Wallet size={36} className="text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-100">Múltiples Destinos</h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Elige entre USDT, Bolívares y otras monedas fiat.
          </p>
        </div>
        <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-5 border border-gray-700 shadow-lg text-center transition-all duration-300 hover:scale-105 hover:border-yellow-500/50">
          <Repeat2 size={36} className="text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-100">Proceso Ágil</h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Realiza tus pedidos de forma rápida y eficiente.
          </p>
        </div>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="clerk-profile-container flex-grow overflow-y-auto p-0 md:p-6">
            <UserProfile />
          </div>
        </div>
      </div>
    )}





      {/* Custom Alert/Modal (for messages like "Redireccionando...") */}
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

      {/* Tailwind Custom Keyframe Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up-fade-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-up-fade-in { animation: scale-up-fade-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
        .font-inter { font-family: 'Inter', sans-serif; } /* Ensure Inter font is used */
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}