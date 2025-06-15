"use client";

type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "LOADING";

interface Props {
  status: VerificationStatus;
}

export default function VerificationStatusBadge({ status }: Props) {
  const getStatusLabel = () => {
    switch (status) {
      case "LOADING":
        return "Cargando...";
      case "NONE":
        return "🔵 No has enviado verificación";
      case "PENDING":
        return "🟡 Verificación pendiente";
      case "APPROVED":
        return "✅ Verificado";
      case "REJECTED":
        return "❌ Verificación rechazada";
      default:
        return "";
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow border border-gray-700">
      {getStatusLabel()}
    </div>
  );
}
