'use client';

import { Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-4000 z-0" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold text-emerald-400 flex items-center gap-2">
          <Lock className="w-7 h-7 text-emerald-400" /> Política de Privacidad
        </h1>
        <p className="text-gray-400">Última actualización: Agosto 2025</p>

        <p>
          En <strong>TuCapi</strong>, operado por <strong>Caibo INC</strong>, nos comprometemos a proteger la privacidad de nuestros usuarios y la seguridad de sus datos personales.
          Esta Política explica cómo recopilamos, usamos, compartimos y protegemos tu información.
        </p>

        {/* 1. Información que recopilamos */}
        <h2 className="text-2xl font-semibold text-teal-300">1. Información que Recopilamos</h2>
        <p>Cuando utilizas nuestra plataforma, podemos recopilar:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li><strong>Datos de registro:</strong> nombre, correo electrónico, teléfono (si aplica), contraseña/hash.</li>
          <li><strong>Datos de identidad (KYC):</strong> documento de identidad y metadatos, selfie/biometría, fecha de nacimiento.</li>
          <li><strong>Datos de transacciones:</strong> montos, monedas, correos o IDs de pago (p. ej., PayPal), direcciones de wallet, hashes on-chain.</li>
          <li><strong>Datos técnicos/telemetría:</strong> dirección IP, país/ciudad aproximados, navegador, sistema operativo, dispositivo, logs de acceso (prevención de fraude y seguridad).</li>
          <li><strong>Comunicación y soporte:</strong> mensajes en chat/soporte y adjuntos que envíes.</li>
        </ul>

        {/* 2. Bases legales y fines */}
        <h2 className="text-2xl font-semibold text-teal-300">2. Bases Legales y Fines del Tratamiento</h2>
        <p>Tratamos tus datos para:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li><strong>Ejecución del contrato:</strong> crear tu cuenta, procesar transacciones, brindar soporte.</li>
          <li><strong>Cumplimiento legal/AML (FINTRAC – MSB):</strong> verificación de identidad (KYC), prevención de lavado y fraude.</li>
          <li><strong>Interés legítimo:</strong> seguridad, detección de abusos, mejora del servicio, analítica operativa mínima.</li>
          <li><strong>Consentimiento (si aplica):</strong> comunicaciones comerciales y cookies analíticas no esenciales.</li>
        </ul>
        <p className="text-gray-300">
          No vendemos tu información personal. La <strong>divulgación</strong> a terceros se limita a los fines indicados y al mínimo necesario.
        </p>

        {/* 3. Conservación de datos */}
        <h2 className="text-2xl font-semibold text-teal-300">3. Conservación de Datos</h2>
        <p className="text-gray-300">Conservamos los datos solo por el tiempo necesario:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li><strong>KYC</strong>: hasta <strong>5 años</strong> desde la última transacción (cumplimiento AML/FINTRAC).</li>
          <li><strong>Transacciones</strong>: <strong>5 años</strong> (auditoría y obligaciones financieras).</li>
          <li><strong>Logs técnicos/IP</strong>: <strong>12 meses</strong> (seguridad y prevención de fraude).</li>
          <li><strong>Cuenta/soporte</strong>: mientras la cuenta esté activa y, al cerrarse, según plazos anteriores o exigencias legales.</li>
        </ul>
        <p className="text-gray-300">Cumplidos los plazos, <strong>anonimizamos o eliminamos</strong> salvo obligación legal de conservación.</p>

        {/* 4. Seguridad */}
        <h2 className="text-2xl font-semibold text-teal-300">4. Seguridad de la Información</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Cifrado <strong>TLS</strong> en tránsito y cifrado en reposo en sistemas que lo soporten.</li>
          <li><strong>Control de acceso basado en roles</strong> (principio de mínimo privilegio) y <strong>2FA</strong> en cuentas internas.</li>
          <li><strong>Registro/auditoría</strong> de accesos y operaciones sensibles.</li>
          <li>Evaluaciones y mejoras de seguridad de forma periódica.</li>
          <li>Gestión de incidentes: notificaremos a los usuarios afectados en tiempo razonable conforme a la ley aplicable.</li>
        </ul>

        {/* 5. Terceros y transferencias internacionales */}
        <h2 className="text-2xl font-semibold text-teal-300">5. Proveedores, Encargados y Transferencias Internacionales</h2>
        <p className="text-gray-300">Podemos compartir datos con terceros de confianza para operar el servicio:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li><strong>Autenticación</strong> (p. ej., proveedor de identidad): manejo de sesiones/usuarios.</li>
          <li><strong>Verificación de identidad (KYC)</strong>: validación documental/biométrica.</li>
          <li><strong>Almacenamiento</strong>: hosting, bases de datos y archivos (p. ej., documentos KYC/imágenes).</li>
          <li><strong>Mensajería en tiempo real y notificaciones</strong>: actualización de estado y soporte.</li>
          <li><strong>Analítica esencial</strong>: métricas operativas para mejorar el servicio (solo con consentimiento si no son esenciales).</li>
        </ul>
        <p className="text-gray-300">
          Algunos proveedores pueden estar fuera de Canadá. Cuando transferimos datos internacionalmente, aplicamos <strong>cláusulas contractuales</strong> y salvaguardas adecuadas para proteger tu información.
        </p>

        {/* 6. Cookies */}
        <h2 className="text-2xl font-semibold text-teal-300">6. Cookies y Tecnologías Similares</h2>
        <p className="text-gray-300">
          Usamos cookies <strong>necesarias</strong> para seguridad y funcionamiento del sitio. Con tu consentimiento, también podemos usar cookies <strong>analíticas</strong> para entender el uso del servicio.
          Puedes gestionar tus preferencias en <span className="underline">Preferencias de Cookies</span>.
        </p>

        {/* 7. Tus derechos */}
        <h2 className="text-2xl font-semibold text-teal-300">7. Tus Derechos</h2>
        <p className="text-gray-300">Puedes solicitar:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li><strong>Acceso</strong> a tus datos personales.</li>
          <li><strong>Rectificación</strong> de datos inexactos.</li>
          <li><strong>Eliminación</strong> de tu cuenta (sujeta a retención legal/AML).</li>
          <li><strong>Oposición/limitación</strong> y <strong>revocación del consentimiento</strong> cuando aplique.</li>
        </ul>
        <p className="text-gray-300">
          Responderemos en un plazo máximo de <strong>30 días</strong>. Para protegerte, podremos solicitar información adicional para <strong>verificar tu identidad</strong> antes de atender la solicitud.
        </p>

        {/* 8. Acciones en caso de fraude (tono prudente) */}
        <h2 className="text-2xl font-semibold text-teal-300">8. Acciones en Caso de Fraude o Abuso</h2>
        <p className="text-gray-300">
          Si tras la entrega de fondos se inicia un reverso/contracargo o detectamos abuso, podremos <strong>investigar</strong>, 
          <strong>suspender</strong> temporalmente la cuenta y colaborar con plataformas de pago y autoridades competentes según corresponda.
        </p>

        {/* 9. Cambios */}
        <h2 className="text-2xl font-semibold text-teal-300">9. Cambios a esta Política</h2>
        <p className="text-gray-300">
          Podemos actualizar esta Política. Publicaremos la versión vigente con su fecha. Si hay cambios significativos, te lo notificaremos en la plataforma.
        </p>

        {/* 10. Contacto */}
        <h2 className="text-2xl font-semibold text-teal-300">10. Contacto</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Soporte: <a href="mailto:soporte@tucapi.com" className="text-emerald-400 underline">soporte@tucapi.com</a></li>
          <li>Contacto legal: <span className="text-gray-200">Acton, Ontario. Canada</span></li>
          <li>Formulario disponible en el sitio web.</li>
        </ul>

        {/* Regulación */}
        <div className="mt-10 text-sm text-gray-400 border-t border-gray-700 pt-6">
          <p>
            Caibo INC figura registrada ante FINTRAC (MSB) bajo el número M23238298 desde el 4 de agosto de 2023, habilitada para ofrecer servicios de cambio de divisas tradicionales y operaciones con monedas virtuales. Nuestra actividad se encuentra enmarcada dentro de la normativa vigente en materia de prevención de lavado de activos y financiamiento del terrorismo.
          </p>
        </div>
      </div>
    </main>
  );
}
