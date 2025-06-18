'use client';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-emerald-400">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-gray-400">Última actualización: 15 Junio 2025</p>

        <p>
          Bienvenido a <strong>Tu Capi</strong>, una plataforma operada por <strong>Caibo INC</strong>, registrada como Money Services Business (MSB) bajo FINTRAC en Canadá. Al acceder y utilizar nuestros servicios, usted acepta quedar vinculado por los presentes Términos y Condiciones.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">1. Objeto del Servicio</h2>
        <p>
          Tu Capi ofrece una solución simple y rápida para el intercambio de fondos desde PayPal a criptomonedas (como USDT) o monedas fiduciarias (como Bolívares). El servicio es <strong>P2P no custodial</strong>, es decir:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>No almacenamos fondos ni criptomonedas.</li>
          <li>No ofrecemos wallets internas.</li>
          <li>Las criptomonedas se envían directamente a las direcciones que usted proporcione.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">2. Registro y Verificación</h2>
        <p>Para acceder a nuestros servicios, usted debe:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Ser mayor de edad (18+ años).</li>
          <li>Crear una cuenta en nuestra plataforma.</li>
          <li>Completar exitosamente nuestro proceso de verificación de identidad (KYC).</li>
        </ul>
        <p>
          El KYC es obligatorio como parte de nuestro cumplimiento ante FINTRAC (MSB Canadá). Nos reservamos el derecho de rechazar usuarios que no cumplan con los requisitos de verificación.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">3. Comisiones y Cotizaciones</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Las cotizaciones de cambio se muestran de forma clara antes de confirmar una transacción.</li>
          <li>Para operaciones con PayPal, las comisiones de plataforma y procesamiento ya están incluidas en el monto total mostrado.</li>
          <li>En el caso de redes cripto como TRON o Ethereum, el usuario asume el fee de red, el cual será descontado del monto final a recibir.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">4. Responsabilidad del Usuario</h2>
        <p>Usted es responsable de proporcionar:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Su correo PayPal correctamente.</li>
          <li>La dirección de wallet cripto correcta.</li>
        </ul>
        <p>
          <strong>Tu Capi no se hace responsable</strong> por pérdidas derivadas de direcciones mal ingresadas o datos incorrectos. Una vez enviado el monto acordado a la dirección proporcionada, la transacción se considera completada y no reembolsable.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">5. Soporte</h2>
        <p>
          Ante cualquier inconveniente o duda, usted puede contactarnos mediante:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>El formulario de soporte en nuestra plataforma.</li>
          <li>Correo electrónico: <a href="mailto:soporte@tucapi.com" className="text-emerald-400 underline">soporte@tucapi.com</a></li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">6. Uso Prohibido</h2>
        <p>Está estrictamente prohibido utilizar nuestros servicios para:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Blanqueo de capitales.</li>
          <li>Actividades fraudulentas o ilícitas.</li>
          <li>Suplantación de identidad o manipulación de datos.</li>
        </ul>
        <p>
          Cualquier actividad sospechosa podrá ser reportada a las autoridades correspondientes.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">7. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Le recomendamos revisarlos periódicamente.
        </p>

       
        <h2 className="text-2xl font-semibold text-teal-300">8. Política contra Disputas y Reversiones</h2>
        <p>
          Cualquier intento de reversar pagos (chargebacks), abrir disputas o realizar contracargos en plataformas como PayPal, luego de haber recibido los fondos en cripto o fiat, será considerado un intento de fraude.
        </p>
        <p>
          Tu Capi se reserva el derecho de:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Emprender acciones legales contra el usuario responsable en su país de residencia.</li>
          <li>Reportar el incidente ante las autoridades locales del país del usuario.</li>
          <li>Notificar a agencias internacionales de cumplimiento contra el lavado de dinero y fraude (como FINTRAC, OFAC, Europol o Interpol, si corresponde).</li>
          <li>Suspender o eliminar permanentemente la cuenta del usuario.</li>
        </ul>
        <p>
          Todas las transacciones son auditadas y registradas con evidencia verificable de entrega (hash on-chain, recibos, capturas de pantalla, y comunicaciones). <strong>Intentar realizar una reversión tras recibir los fondos constituye un delito de estafa.</strong>
        </p>


         <h2 className="text-2xl font-semibold text-teal-300">9. Ley Aplicable</h2>
        <p>
          Estos Términos se rigen por las leyes de <strong>Canadá</strong>, provincia de <strong>Ontario</strong>. Cualquier disputa será resuelta por los tribunales de dicha jurisdicción.
        </p>

      </div>
    </main>
  );
}
