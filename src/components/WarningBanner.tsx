'use client';

export default function WarningBanner() {
  return (
    <div className="z-50 w-full bg-yellow-900 text-yellow-100 px-4 py-3 rounded-xl border border-yellow-600 text-center shadow-lg max-w-3xl mx-auto mt-6">
      ⚠️ PayPal está presentando problemas con su plataforma. El mantenimiento que están realizando afecta envíos y revisión de pagos. <strong>Pedimos tener paciencia.</strong> Gracias por la comprensión.
    </div>
  );
}
