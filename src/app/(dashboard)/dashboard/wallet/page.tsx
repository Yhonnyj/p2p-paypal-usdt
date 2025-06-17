"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  type: string;
  details: Record<string, string>;
}

export default function WalletPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState("PayPal");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMethods = async () => {
    setLoading(true);
    const res = await fetch("/api/payment-methods");
    const data = await res.json();
    setPaymentMethods(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    fetchMethods();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, details }),
    });
    if (res.ok) {
      setShowModal(false);
      setDetails({});
      fetchMethods();
    }
    setSubmitting(false);
  };

  const renderMethodDetails = (type: string, details: Record<string, string>) => {
    switch (type) {
      case "PayPal":
        return <p className="text-sm text-gray-200">Correo: {details.email}</p>;
      case "PagoMovil":
        return (
          <div className="text-sm text-gray-200 space-y-1">
            <p>Teléfono: {details.phone}</p>
            <p>Cédula: {details.id}</p>
          </div>
        );
      case "USDT":
        return (
          <div className="text-sm text-gray-200 space-y-1">
            <p>Wallet: {details.wallet}</p>
            <p>Red: {details.network}</p>
          </div>
        );
      default:
        return <pre className="text-xs text-gray-400">{JSON.stringify(details, null, 2)}</pre>;
    }
  };

  const renderDetailsForm = () => {
    switch (type) {
      case "PayPal":
        return (
          <input
            type="email"
            placeholder="Correo PayPal"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={details.email || ""}
            onChange={(e) => setDetails({ email: e.target.value })}
          />
        );
      case "PagoMovil":
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Teléfono"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={details.phone || ""}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
            <input
              type="text"
              placeholder="Cédula"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={details.id || ""}
              onChange={(e) => setDetails({ ...details, id: e.target.value })}
            />
          </div>
        );
      case "USDT":
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Wallet Address"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={details.wallet || ""}
              onChange={(e) => setDetails({ ...details, wallet: e.target.value })}
            />
            <select
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={details.network || "TRC20"}
              onChange={(e) => setDetails({ ...details, network: e.target.value })}
            >
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
              <option value="ERC20">ERC20</option>
              <option value="BinancePay">Binance Pay</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Mi Wallet</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus className="inline-block mr-1" /> Agregar método
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-gray-800 p-4 rounded-xl shadow relative">
              <h3 className="text-lg font-semibold mb-2">{method.type}</h3>
              {renderMethodDetails(method.type, method.details)}
              <button
                onClick={() => handleDelete(method.id)}
                className="absolute top-3 right-3 text-red-400 hover:text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full space-y-4 border border-gray-700">
            <h2 className="text-xl font-bold">Agregar Método</h2>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setDetails({});
              }}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="PayPal">PayPal</option>
              <option value="PagoMovil">Pago Móvil</option>
              <option value="USDT">USDT</option>
            </select>
            {renderDetailsForm()}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                {submitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
