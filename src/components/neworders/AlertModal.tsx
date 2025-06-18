"use client";

import { XCircle, CheckCircle } from "lucide-react";
import { useOrderForm } from "@/context/OrderFormContext";

export default function AlertModal() {
  const { showAlert, alertMessage, alertType, setShowAlert } = useOrderForm();

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-sm w-full text-center transform scale-95 opacity-0 animate-scale-up-fade-in">
        {alertType === "success" ? (
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
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
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
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up-fade-in { animation: scale-up-fade-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
