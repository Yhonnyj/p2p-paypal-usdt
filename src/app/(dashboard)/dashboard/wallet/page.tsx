"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { bankOptions } from "@/lib/bankOptions";
import AddPaymentMethodModal from "@/components/wallet/AddPaymentMethodModal";
import { toast } from "react-toastify";

interface PaymentMethod {
  id: string;
  type: string;
  details: Record<string, string>;
}

const networkOptions = [
  { value: "TRC20", label: "TRC20 (Tron)", img: "/images/trc20.png" },
  { value: "BEP20", label: "BNB Smart Chain (BEP20)", img: "/images/bep20.png" },
  { value: "ARBITRUM", label: "Arbitrum One", img: "/images/arbitrum.png" },
  { value: "BINANCE_PAY", label: "Binance Pay", img: "/images/binance_pay.png" },
];

export default function WalletPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

const fetchMethods = async () => {
  try {
    setLoading(true);
    const res = await fetch("/api/payment-methods");
    if (!res.ok) throw new Error("Error al cargar métodos de pago");
    const data = await res.json();
    setPaymentMethods(data);
  } catch {
    toast.error("Error al cargar métodos de pago.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMethods();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    fetchMethods();
  };

  const renderMethodDetails = (type: string, details: Record<string, string>) => {
    switch (type) {
      case "PayPal":
        return <p className="text-sm text-gray-200">Correo: {details.email}</p>;

      case "BS":
        return (
          <div className="text-sm text-gray-200 space-y-1">
            <p>Banco: {details.bankName}</p>
            <p>Teléfono: {details.phone}</p>
            <p>Cédula: {details.idNumber}</p>
          </div>
        );

      case "USDT":
        return (
          <div className="text-sm text-gray-200 space-y-1">
            <p>Wallet: {details.address}</p>
            <p>Red: {details.network}</p>
          </div>
        );

      default:
        return <pre className="text-xs text-gray-400">{JSON.stringify(details, null, 2)}</pre>;
    }
  };

  return (
    <div className="p-4 sm:p-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-center sm:text-left">
          Mis Cuentas
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <Plus className="inline-block mr-1" /> Agregar método
        </button>
      </div>

      {/* Métodos de pago */}
      {loading ? (
        <p className="text-gray-400 text-center">Cargando...</p>
      ) : paymentMethods.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes métodos de pago agregados.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paymentMethods.map((method) => {
            let iconSrc = "/images/bs.png";
            if (method.type === "PayPal") {
              iconSrc = "/images/paypal.png";
            } else if (method.type === "BS") {
              const bank = bankOptions.find((b) => b.value === method.details.bankName);
              iconSrc = bank?.img || "/images/banks/default.png";
            } else if (method.type === "USDT") {
              const net = networkOptions.find((n) => n.value === method.details.network);
              iconSrc = net?.img || "/images/trc20.png";
            }

            return (
              <div
                key={method.id}
                className="bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-700 relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <Image
                  src={iconSrc}
                  alt={method.type}
                  width={42}
                  height={42}
                  className="rounded-full border border-gray-600 mx-auto sm:mx-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-1">
                    {method.type}
                  </h3>
                  {renderMethodDetails(method.type, method.details)}
                </div>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddPaymentMethodModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={(type: string, formData: Record<string, string>) => {
            let details = { ...formData };

            if (type === "USDT") {
              if (!formData.address || !formData.network) {
                toast.error("Completa la wallet y red USDT.");
                return;
              }
              details = {
                address: formData.address,
                network: formData.network,
              };
            }

            if (type === "PayPal") {
              if (!formData.email) {
                toast.error("Ingresa un correo de PayPal.");
                return;
              }
              details = { email: formData.email };
            }

            if (type === "BS") {
              if (!formData.bankName || !formData.phone || !formData.idNumber) {
                toast.error("Completa todos los campos de la cuenta bancaria.");
                return;
              }
              details = {
                bankName: formData.bankName,
                phone: formData.phone,
                idNumber: formData.idNumber,
              };
            }

            fetch("/api/payment-methods", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, details }),
            }).then(() => fetchMethods());
          }}
        />
      )}
    </div>
  );
}
