'use client';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-4000 z-0" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-3xl">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-emerald-400">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-gray-400">Última actualización: Octubre 2025</p>

          <p>
            Bienvenido a <strong>TuCapi</strong>, una plataforma operada por <strong>TU CAPI LLC</strong>, que contrata los servicios de CAIBO INC., empresa registrada como Money Services Business (MSB) ante FINTRAC. 
            Al acceder y utilizar nuestros servicios, usted acepta quedar vinculado por los presentes Términos y Condiciones.
          </p>

          {/* 1. Objeto del Servicio */}
          <h2 className="text-2xl font-semibold text-teal-300">1. Objeto del Servicio</h2>
          <p>
            TuCapi ofrece una solución simple y rápida para el intercambio de fondos desde plataformas de pago de terceros 
            (por ejemplo, PayPal) a criptomonedas (por ejemplo, USDT) o monedas fiduciarias (por ejemplo, Bolívares). 
            El servicio es <strong>P2P no custodial</strong>, es decir:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>No almacenamos fondos ni criptomonedas.</li>
            <li>No ofrecemos wallets internas.</li>
            <li>Los fondos (cripto o fiat) se envían directamente a los datos/direcciones que el usuario suministre.</li>
          </ul>
          <p className="text-gray-300">
            Como servicio no custodial, <strong>solo procesamos y enviamos</strong> una vez que confirmamos la <strong>recepción y validez</strong> del pago del usuario 
            (incluyendo verificaciones antifraude y/o confirmaciones on-chain cuando aplique).
          </p>

          {/* 2. Registro y Verificación */}
          <h2 className="text-2xl font-semibold text-teal-300">2. Registro y Verificación</h2>
          <p>Para acceder a nuestros servicios, usted debe:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Ser mayor de edad (18+ años).</li>
            <li>Crear una cuenta en nuestra plataforma.</li>
            <li>Completar exitosamente nuestro proceso de verificación de identidad (KYC), obligatorio por cumplimiento FINTRAC (MSB).</li>
          </ul>
          <p className="text-gray-300">
            TuCapi podrá solicitar documentación adicional, realizar verificaciones manuales o automáticas, 
            y <strong>rechazar o limitar</strong> cuentas que no cumplan con los requisitos de verificación o presenten señales de riesgo.
          </p>

          {/* 3. Comisiones y Cotizaciones */}
          <h2 className="text-2xl font-semibold text-teal-300">3. Comisiones y Cotizaciones</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Las cotizaciones de cambio se muestran de forma clara antes de confirmar una transacción.</li>
            <li>Para operaciones con PayPal, las comisiones de plataforma/procesamiento pueden estar incluidas en el monto mostrado o detalladas antes de confirmar.</li>
            <li>En redes cripto (p. ej., TRON o Ethereum), el usuario asume el <em>network fee</em>, descontado del monto final a recibir.</li>
          </ul>

          {/* 4. Proceso Operativo */}
          <h2 className="text-2xl font-semibold text-teal-300">4. Proceso Operativo</h2>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            <li>El usuario solicita el intercambio y visualiza la cotización.</li>
            <li>TuCapi verifica la recepción y validez del pago (y/o confirmaciones on-chain).</li>
            <li>Una vez confirmado, TuCapi realiza el envío a los datos/dirección aportados por el usuario.</li>
            <li>La operación se marca como completada y se registra (incluyendo comprobantes/hashes).</li>
          </ol>

          {/* 5. Responsabilidad del Usuario */}
<h2 className="text-2xl font-semibold text-teal-300">5. Responsabilidad del Usuario</h2>
<p>Usted es responsable de proporcionar:</p>
<ul className="list-disc list-inside space-y-1 text-gray-300">
  <li>Correo, teléfono y/o datos de pago correctos y vigentes.</li>
  <li>La dirección de billetera o información de destino exacta.</li>
  <li>
    El titular de la cuenta registrada en TuCapi debe ser el mismo titular de la cuenta 
    de pago utilizada (por ejemplo, PayPal). <strong>No se aceptan cuentas de terceros</strong>.
  </li>
</ul>
<p className="text-gray-300">
  <strong>TuCapi no se hace responsable</strong> por pérdidas derivadas de datos mal ingresados por el usuario. 
  En cripto, las transacciones son generalmente <strong>irreversibles</strong>; una vez enviado el monto acordado a la dirección proporcionada, 
  la transacción se considera completada y no reembolsable.
</p>


          {/* 6. Límites, Seguridad y Antifraude */}
          <h2 className="text-2xl font-semibold text-teal-300">6. Límites, Seguridad y Antifraude</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Podemos aplicar <strong>límites por usuario</strong> (monto, frecuencia) y ajustar dichos límites según historial y nivel de verificación.</li>
            <li>Podemos <strong>pausar o cancelar</strong> operaciones ante señales de riesgo (discordancia de identidad, IP/dispositivo inusual, patrones atípicos).</li>
            <li>Podemos solicitar <strong>verificación adicional</strong> antes de continuar.</li>
          </ul>

          {/* 7. Uso Prohibido */}
          <h2 className="text-2xl font-semibold text-teal-300">7. Uso Prohibido</h2>
          <p>Está estrictamente prohibido utilizar nuestros servicios para:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Blanqueo de capitales.</li>
            <li>Actividades fraudulentas o ilícitas.</li>
            <li>Suplantación de identidad o manipulación de datos.</li>
          </ul>
          <p>Cualquier actividad sospechosa podrá ser reportada a las autoridades correspondientes.</p>

          {/* 8. Disputas / Contracargos */}
          <h2 className="text-2xl font-semibold text-teal-300">8. Disputas, Contracargos y Reversiones</h2>
          <p className="text-gray-300">
            Si se inicia una disputa, contracargo o reversión en plataformas de pago tras haberse entregado los fondos, 
            TuCapi <strong>investigará el caso</strong> y podrá <strong>suspender temporalmente</strong> la cuenta mientras se resuelve.
          </p>
          <p className="text-gray-300">
            Si se confirma abuso o fraude, TuCapi podrá: (i) cerrar la cuenta, (ii) informar el incidente a la plataforma de pago, 
            (iii) reportar a las autoridades competentes y, cuando corresponda, (iv) iniciar acciones legales.
          </p>
          <p className="text-gray-300">
            Todas las transacciones son auditadas y registradas con evidencia de entrega (p. ej., hash on-chain, recibos y comunicaciones).
          </p>

          {/* 9. Disponibilidad del Servicio */}
          <h2 className="text-2xl font-semibold text-teal-300">9. Disponibilidad del Servicio</h2>
          <p className="text-gray-300">
            TuCapi procura alta disponibilidad; sin embargo, puede haber interrupciones por mantenimiento, fallas de terceros o causas de fuerza mayor. 
            En tales casos, trabajaremos para restablecer el servicio a la brevedad.
          </p>

          {/* 10. Modificaciones */}
          <h2 className="text-2xl font-semibold text-teal-300">10. Modificaciones</h2>
          <p className="text-gray-300">
            Podemos modificar estos Términos en cualquier momento. Publicaremos la versión vigente y la fecha de actualización. 
            El uso continuado del servicio implica aceptación de los cambios.
          </p>

          {/* 11. Ley Aplicable */}
          <h2 className="text-2xl font-semibold text-teal-300">11. Ley Aplicable y Jurisdicción</h2>
          <p className="text-gray-300">
            Estos Términos se rigen por las leyes de <strong>Estados Unidos</strong>, estado de <strong>Wyoming</strong>. 
            Cualquier disputa será resuelta por los tribunales competentes de dicha jurisdicción.
          </p>

          {/* 12. Soporte y Contacto Legal */}
          <h2 className="text-2xl font-semibold text-teal-300">12. Soporte y Contacto Legal</h2>
          <p className="text-gray-300">
            Soporte: <a href="mailto:soporte@tucapi.com" className="text-emerald-400 underline">soporte@tucapi.app</a>
          </p>
          <p className="text-gray-300">
            Contacto legal: <span className="text-gray-200">1621 Central Ave, suite 8110. Cheyenne, WY 82001. Estados Unidos</span>
          </p>

          {/* 13. Cookies y Preferencias */}
          <h2 className="text-2xl font-semibold text-teal-300">13. Cookies y Preferencias</h2>
          <p className="text-gray-300">
            Usamos cookies <strong>necesarias</strong> para seguridad y funcionamiento básico del sitio, y cookies <strong>analíticas</strong> (opcionales) para entender el uso del servicio y mejorarlo. 
            Las analíticas solo se cargan si nos das tu consentimiento. Puedes cambiar tu elección en cualquier momento desde:
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))}
            className="mt-2 inline-flex items-center px-3 py-2 rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400"
          >
            Preferencias de Cookies
          </button>
        </div>

        {/* Información de regulación */}
        <div className="mt-10 text-sm text-gray-400 border-t border-gray-700 pt-6">
          <p>Tu Capi LLC, contrata los servicios de Caibo Inc., registrada ante FINTRAC (MSB) C100000990 desde Octubre de 2025, para la prestación de servicios de intercambio de divisas tradicionales y monedas virtuales conforme a las regulaciones AML/CFT de Canadá.</p> 
        </div>
      </div>
    </main>
  );
}
