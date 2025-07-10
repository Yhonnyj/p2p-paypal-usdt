'use client';

import { Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-emerald-400 flex items-center gap-2">
          <Lock className="w-7 h-7 text-emerald-400" /> Política de Privacidad
        </h1>
        <p className="text-gray-400">Última actualización: Julio 2025</p>

        <p>
          En <strong>Tu Capi</strong>, operado por <strong>Caibo INC</strong>, nos comprometemos a proteger la privacidad de nuestros usuarios y la seguridad de sus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">1. Información que Recopilamos</h2>
        <p>Cuando utilizas nuestra plataforma, podemos recopilar la siguiente información:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Datos de registro: nombre, correo electrónico, contraseña.</li>
          <li>Datos de identidad (KYC): foto del documento de identidad, selfie, fecha de nacimiento.</li>
          <li>Datos de transacciones: montos, monedas utilizadas, correos PayPal, direcciones de wallet cripto.</li>
          <li>Datos técnicos: dirección IP, navegador, país, dispositivo (para prevención de fraude).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">2. Uso de la Información</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Verificar tu identidad (KYC) según normativa de FINTRAC (MSB).</li>
          <li>Procesar las transacciones y garantizar su correcto cumplimiento.</li>
          <li>Ofrecer soporte en caso de incidencias.</li>
          <li>Cumplir con requerimientos legales y prevenir actividades ilícitas.</li>
        </ul>
        <p>Nunca venderemos ni compartiremos tu información personal con terceros con fines comerciales, ya que está protegida por las leyes de compartimiento de información.</p>

        <h2 className="text-2xl font-semibold text-teal-300">3. Conservación de Datos</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Conservamos tus datos mientras tengas una cuenta activa.</li>
          <li>Si cierras tu cuenta, conservaremos tu información el tiempo estrictamente necesario (18 meses) para cumplir con leyes aplicables (como auditorías regulatorias o reportes financieros).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">4. Seguridad</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Utilizamos cifrado y prácticas de seguridad estándar para proteger tus datos.</li>
          <li>Los documentos de verificación son almacenados en servidores seguros o mediante terceros autorizados (como proveedores de verificación).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-teal-300">5. Terceros</h2>
        <p>Podemos utilizar servicios de terceros como:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Para autenticación segura.</li>
          <li>Para notificaciones en tiempo real.</li>
          <li>Para almacenar imágenes/documentos.</li>
          <li>Proveedores de KYC (si aplica).</li>
        </ul>
        <p>Todos cumplen normativas internacionales de protección de datos.</p>

        <h2 className="text-2xl font-semibold text-teal-300">6. Tus Derechos</h2>
        <p>Como usuario, puedes:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Solicitar acceso a los datos que tenemos sobre ti.</li>
          <li>Pedir corrección de datos incorrectos.</li>
          <li>Solicitar eliminación de tu cuenta.</li>
          <li>Revocar el consentimiento de procesamiento (si aplica legalmente).</li>
        </ul>
        <p>Para ejercer estos derechos, escríbenos a: <a href="mailto:soporte@tucapi.com" className="text-emerald-400 underline">soporte@tucapi.com</a></p>

        <h2 className="text-2xl font-semibold text-teal-300">7. Acciones en Caso de Fraude</h2>
        <p>
          En caso de que un usuario reciba los fondos acordados (en criptomonedas o fiat) y posteriormente inicie un <strong>reverso o disputa</strong> en plataformas como PayPal u otros métodos utilizados, consideraremos esta acción como un intento de estafa.
        </p>
        <p>
          <strong>Tu Capi</strong> se reserva el derecho de:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Iniciar acciones legales por fraude.</li>
          <li>Reportar al usuario ante autoridades locales del país correspondiente.</li>
          <li>Reportar ante entidades internacionales y plataformas de pago por intento de estafa.</li>
        </ul>
        <p>
          Nos tomamos la seguridad financiera muy en serio y protegeremos nuestra operación ante cualquier abuso.
        </p>

        <h2 className="text-2xl font-semibold text-teal-300">8. Cambios a esta Política</h2>
        <p>Nos reservamos el derecho de actualizar esta Política. Notificaremos cualquier cambio significativo a través de nuestra plataforma.</p>

        <h2 className="text-2xl font-semibold text-teal-300">9. Contacto</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Correo: <a href="mailto:soporte@tucapi.com" className="text-emerald-400 underline">soporte@tucapi.com</a></li>
          <li>Formulario disponible en el sitio web</li>
        </ul>

        {/* Información de regulación */}
        <div className="mt-10 text-sm text-gray-400 border-t border-gray-700 pt-6">
          <p>
            Caibo INC, figura registrada ante FINTRAC (MSB) bajo el número M23238298 desde el 4 de agosto de 2023, habilitada para ofrecer servicios de cambio de divisas tradicionales y operaciones con monedas virtuales. Nuestra actividad se encuentra enmarcada dentro de la normativa vigente en materia de prevención de lavado de activos y financiamiento del terrorismo.
          </p>
        </div>
      </div>
    </main>
  );
}
