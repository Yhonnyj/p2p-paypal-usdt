'use client';

export default function WarningBanner() {
  if (typeof window === "undefined") return null;

  const now = new Date();
  const localTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Moncton",
  }).format(now);
  const hour = parseInt(localTime);
  const showWarning = hour >= 22 || hour < 8;

  if (!showWarning) return null;

  return (
    <div className="z-50 w-full bg-yellow-900 text-yellow-100 px-4 py-3 rounded-xl border border-yellow-600 text-center shadow-lg max-w-3xl mx-auto mt-6">
      ⚠️ Toda operación o verificación enviada después de las <strong>9:30 p.m. (hora de Venezuela)</strong> será revisada al siguiente día a partir de las <strong>8:00 a.m.</strong>. Gracias por su comprensión.
    </div>
  );
}
