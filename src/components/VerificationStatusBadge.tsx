"use client";

import {
  Loader2,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "LOADING";

interface Props {
  status: VerificationStatus;
}

export default function VerificationStatusBadge({ status }: Props) {
  const getStatusStyles = () => {
    switch (status) {
      case "LOADING":
        return "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border-gray-600";
      case "NONE":
        return "bg-gradient-to-r from-blue-700 to-blue-800 text-blue-100 border-blue-600";
      case "PENDING":
        return "bg-gradient-to-r from-yellow-700 to-yellow-800 text-yellow-100 border-yellow-600";
      case "APPROVED":
        return "bg-gradient-to-r from-green-700 to-green-800 text-green-100 border-green-600";
      case "REJECTED":
        return "bg-gradient-to-r from-red-700 to-red-800 text-red-100 border-red-600";
      default:
        return "";
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case "LOADING":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando...</span>
          </>
        );
      case "NONE":
        return (
          <>
            <Info className="h-4 w-4" />
            <span>No has enviado verificación</span>
          </>
        );
      case "PENDING":
        return (
          <>
            <Clock className="h-4 w-4" />
            <span>Verificación pendiente</span>
          </>
        );
      case "APPROVED":
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Verificado</span>
          </>
        );
      case "REJECTED":
        return (
          <>
            <XCircle className="h-4 w-4" />
            <span>Verificación rechazada</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute top-4 right-4 px-4 py-2 rounded-xl text-sm font-medium border shadow-md flex items-center gap-2 transition-all duration-300 ${getStatusStyles()}`}
    >
      {getStatusContent()}
    </div>
  );
}
