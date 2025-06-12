"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Zap, XCircle, CheckCircle } from "lucide-react";

export default function NuevoPedidoPage() {
  const [monto, setMonto] = useState(100);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [network, setNetwork] = useState("TRC20"); // Default network for USDT
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<{ currency: string; rate: number }[]>([]);
  const [selectedDestinationCurrency, setSelectedDestinationCurrency] = useState("USDT");

  // New state for selected platform (e.g., PayPal, Zinli, Zelle)
  const [selectedPlatform, setSelectedPlatform] = useState("PayPal");

  // States for BS-specific additional fields (phone, ID)
  const [bsPhoneNumber, setBsPhoneNumber] = useState("");
  const [bsIdNumber, setBsIdNumber] = useState("");

  // Consolidated state for bank name (used for all fiat currencies, including BS)
  const [bankName, setBankName] = useState("");

  // State for custom alert/modal
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  // FIX: Corrected TypeScript syntax for useState type annotation
  const [alertType, setAlertType] = useState<'success' | 'error'>('error'); 

  // Determine the effective rate for calculations.
  const rate = selectedDestinationCurrency === "USDT"
    ? (exchangeRates.find(r => r.currency === "USD")?.rate ?? 1)
    : (exchangeRates.find(r => r.currency === selectedDestinationCurrency)?.rate ?? null);


  const montoRecibido = feePercent !== null && rate !== null
    ? (selectedDestinationCurrency === "USDT"
      ? monto * (1 - feePercent / 100)
      : monto * (1 - feePercent / 100) * rate)
    : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configRes = await fetch("/api/config");
        // *** CAMBIO CRÍTICO AQUÍ: Ahora llama a la API de tasas para clientes ***
        const ratesRes = await fetch("/api/rates"); 

        const configData = await configRes.json();
        const ratesData = await ratesRes.json();

        // --- LOGS DE DEPURACIÓN (Mantenidos para tu verificación) ---
        console.log("FETCHING DATA FOR NEW ORDER PAGE:");
        console.log("Config Response:", configRes);
        console.log("Config Data:", configData);
        console.log("Rates Response (from /api/rates):", ratesRes); 
        console.log("Rates Data (from /api/rates):", ratesData);     
        // --- FIN LOGS DE DEPURACIÓN ---

        if (configRes.ok) setFeePercent(configData.feePercent);
        if (ratesRes.ok) {
          setExchangeRates(ratesData);
        } else {
          console.error("Error al obtener tasas del API de clientes:", ratesData.error || "Error desconocido");
          displayAlert("Error al cargar las tasas de cambio. Por favor, inténtalo de nuevo más tarde.", "error");
        }
      } catch (err) {
        console.error("Error de conexión al cargar la configuración o las tasas de cambio:", err);
        displayAlert("Error de conexión al cargar la configuración o las tasas de cambio.", "error");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayAlert = (message: string, type: 'success' | 'error' = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const handleCrearOrden = async () => {
    // Validate platform selection
    if (selectedPlatform !== "PayPal") { // Only PayPal is allowed for now
        displayAlert("Solo la plataforma PayPal está disponible actualmente.");
        return;
    }

    if (!paypalEmail) {
      displayAlert("Completa el campo de correo de PayPal.");
      return;
    }

    let recipientDetails: any = {};

    if (selectedDestinationCurrency === "USDT") {
      if (!wallet) {
        displayAlert("Completa el campo de wallet USDT.");
        return;
      }
      recipientDetails = {
        type: "USDT",
        currency: "USDT",
        wallet: wallet,
        network: network,
      };
    } else {
      if (!bankName) {
        displayAlert("Completa el campo de Nombre del Banco.");
        return;
      }
      recipientDetails = {
        type: "FIAT",
        currency: selectedDestinationCurrency,
        bankName: bankName,
      };

      if (selectedDestinationCurrency === "BS") {
        if (!bsPhoneNumber || !bsIdNumber) {
          displayAlert("Completa los campos de Número de Teléfono y Cédula de Identidad para BS.");
          return;
        }
        recipientDetails.phoneNumber = bsPhoneNumber;
        recipientDetails.idNumber = bsIdNumber;
      }
    }

    setLoading(true);
    try {
      const requestBody = {
        platform: selectedPlatform, // Use the selected platform
        amount: monto,
        paypalEmail,
        recipientDetails: recipientDetails,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok) {
        displayAlert("✅ Orden creada exitosamente.", 'success');
        // Reset form fields after successful order creation
        setMonto(100);
        setPaypalEmail("");
        setNetwork("TRC20");
        setWallet("");
        setBankName("");
        setBsPhoneNumber("");
        setBsIdNumber("");
        setSelectedDestinationCurrency("USDT"); // Reset to default destination
        setSelectedPlatform("PayPal"); // Reset platform to default
      } else {
        displayAlert("Error: " + (data.error || "Algo salió mal."), 'error');
        console.error("API Error Response:", data);
      }
    } catch (err) {
      console.error("Error al crear la orden:", err);
      displayAlert("Error al crear la orden. Inténtalo de nuevo.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter out USD as it's typically used as the base for rates, not a direct receive currency here
  const availableFiatCurrencies = exchangeRates.filter(r => r.currency !== "USD");

  // Platform options with image paths and disabled status
  const platformOptions = [
    { value: "PayPal", label: "PayPal", img: "/images/paypal.png", disabled: false },
    { value: "Zinli", label: "Zinli", img: "/images/zinli.png", disabled: true }, // Disabled for now
    { value: "Zelle", label: "Zelle", img: "/images/zelle.png", disabled: true },   // Disabled for now
  ];

  const networkOptions = [
    { value: "TRC20", label: "TRC20 (Tron)", img: "/images/trc20.png" },
    { value: "BEP20", label: "BNB Smart Chain (BEP20)", img: "/images/bep20.png" },
    { value: "ARBITRUM", label: "Arbitrum One", img: "/images/arbitrum.png" },
    { value: "BINANCE_PAY", label: "Binance Pay", img: "/images/binance_pay.png" },
  ];

  // Helper to get image for a given platform
  const getPlatformImage = (platformValue: string) => {
    return platformOptions.find(opt => opt.value === platformValue)?.img || "/images/placeholder.png";
  };

  // Helper to get image for a given currency
  const getCurrencyImage = (currency: string) => {
    if (currency === "USDT") {
      return "/images/usdt.png";
    }
    // Placeholder for Fiat currencies
    // You'll need to add actual image paths for your fiat currencies (e.g., bs.png, ars.png)
    return `/images/${currency.toLowerCase()}.png`; // Example: /images/bs.png, /images/ars.png
  };

  // Helper to get image for a given network
  const getNetworkImage = (netValue: string) => {
    return networkOptions.find(opt => opt.value === netValue)?.img || "/images/placeholder.png";
  };

  return (
    // Removido min-h-screen y clases de fondo, que son manejados por DashboardLayout.
    // El flex items-center justify-center asegura que el formulario esté centrado.
    <div className="flex-1 text-white font-inter flex items-center justify-center"> 
      {/* Removido el div de fondo absoluto */}
      
      <div className="w-full max-w-xl rounded-3xl border border-gray-700 bg-gray-900/80 shadow-2xl backdrop-blur-xl p-8 relative overflow-hidden transform transition-all duration-300 hover:shadow-green-500/20">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center gap-3 drop-shadow-lg">
          <Zap className="animate-pulse text-yellow-400 drop-shadow-md" size={36} />
          Nuevo Pedido
        </h1>

        <div className="space-y-6">
          {/* Plataforma Section - Now a Select with Image */}
          <div className="mt-6">
            <label className="text-sm text-gray-300 mb-2 block font-medium">Plataforma</label>
            <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
              <div className="p-2 flex items-center justify-center">
                 <img src={getPlatformImage(selectedPlatform)} alt={`${selectedPlatform} Icon`} className="h-10 w-10 object-contain rounded-full" onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }} />
              </div>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                {platformOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label} {opt.disabled ? "(Próximamente)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destino Section - With Select and Image Display */}
          <div className="mt-6">
            <label className="text-sm text-gray-300 mb-2 block font-medium">Destino</label>
            <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
              <div className="p-2 flex items-center justify-center">
                 <img src={getCurrencyImage(selectedDestinationCurrency)} alt={`${selectedDestinationCurrency} Icon`} className="h-10 w-10 object-contain rounded-full" onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }} />
              </div>
              <select
                value={selectedDestinationCurrency}
                onChange={(e) => {
                  setSelectedDestinationCurrency(e.target.value);
                  setWallet("");
                  setNetwork("TRC20");
                  setBankName("");
                  setBsPhoneNumber("");
                  setBsIdNumber("");
                }}
                className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                <option value="USDT">USDT</option>
                {availableFiatCurrencies.length > 0 ? (
                  availableFiatCurrencies.map((r) => (
                    <option key={r.currency} value={r.currency}>
                      {r.currency}
                    </option>
                  ))
                ) : (
                  exchangeRates.length === 0 && <option value="" disabled>Cargando monedas...</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block font-medium">Correo de PayPal</label>
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="cliente@paypal.com"
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>

          {selectedDestinationCurrency === "USDT" && (
            <div className="mt-6">
              <label className="text-sm text-gray-300 mb-2 block font-medium">Red para recibir USDT</label>
              <div className="flex items-center gap-4 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
                <div className="p-2 flex items-center justify-center">
                  <img src={getNetworkImage(network)} alt={`${network} Icon`} className="h-10 w-10 object-contain rounded-full" onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }} />
                </div>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="flex-grow px-3 py-3 bg-transparent text-white text-lg focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-200 cursor-pointer"
                >
                  {networkOptions.map((net) => (
                    <option key={net.value} value={net.value}>
                      {net.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <label className="text-sm text-gray-300 mb-1 block font-medium">
                  {network === "BINANCE_PAY" ? "User ID de Binance Pay" : "Wallet USDT"}
                </label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder={
                    network === "BINANCE_PAY"
                      ? "Ej: 123456789"
                      : network === "TRC20"
                      ? "Ej: TNdzfERDpxLDS2w1..."
                      : "Ej: 0x4499AD..."
                  }
                  className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
                />
              </div>
            </div>
          )}

          {selectedDestinationCurrency !== "USDT" && (
            <div className="mt-6">
              <div>
                <label className="text-sm text-gray-300 mb-1 block font-medium">Nombre del Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ej: Banco de Venezuela / Otro Banco"
                  className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
                />
              </div>
            </div>
          )}

          {selectedDestinationCurrency === "BS" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block font-medium">Número de Teléfono (BS)</label>
                <input
                  type="text"
                  value={bsPhoneNumber}
                  onChange={(e) => setBsPhoneNumber(e.target.value)}
                  placeholder="Ej: 0412-1234567"
                  className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block font-medium">Cédula de Identidad (BS)</label>
                <input
                  type="text"
                  value={bsIdNumber}
                  onChange={(e) => setBsIdNumber(e.target.value)}
                  placeholder="Ej: V-12345678"
                  className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
                />
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="text-sm text-gray-300 mb-1 block font-medium">Monto a enviar (USD)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-md"
            />
          </div>

          <div className="bg-gray-800/60 rounded-2xl p-6 text-base border border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-green-500/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 font-medium">Cotización del día</span>
              <span className="text-red-400 font-bold text-lg">
                {selectedDestinationCurrency === "USDT" ?
                  (feePercent !== null ? (1 + feePercent / 100).toFixed(2) : "Cargando...")
                  : (rate !== null ? rate.toFixed(2) : "N/A")
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Usted recibirá</span>
              <span className="text-green-400 text-2xl font-extrabold flex items-center gap-1">
                {feePercent !== null && rate !== null
                  ? montoRecibido.toFixed(2)
                  : "Cargando..."}{" "}
                <span className="text-xl font-semibold">{selectedDestinationCurrency}</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleCrearOrden}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transform active:scale-98 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </span>
            ) : (
              <>Continuar <ArrowRight size={22} /></>
            )}
          </button>
        </div>
      </div>

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
      {/* Tailwind Custom Animations for Premium Feel */}
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
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}