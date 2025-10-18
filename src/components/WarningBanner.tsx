'use client';

export default function WarningBanner() {
  return (
    <div className="z-50 w-full bg-yellow-900 text-yellow-100 px-4 py-3 rounded-xl border border-yellow-600 text-center shadow-lg max-w-3xl mx-auto mt-6">
      ⚠️ <strong>El sistema de Pago Móvil en BOLÍVARES</strong> está presentando fallas en algunos usuarios. 
      Estamos realizando los pagos, pero se están tardando un poco más de lo normal. 
      <br />
      <br />
      🟡 El problema es directamente del sistema <strong>PAGO MÓVIL</strong>, no tiene nada que ver con nosotros. 
      <br />
      🙏 Gracias por su comprensión.
    </div>
  );
}
