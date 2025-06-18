// app/(public)/faq/page.tsx
import React from 'react';
import Link from 'next/link';

const FaqPage = () => {
  const faqs = [
    {
      question: '¿Qué es TuCapi y cómo funciona?',
      answer:
        'TuCapi es tu plataforma P2P segura y eficiente para intercambiar PayPal por USDT y/o Bolívares (BS) y pronto otras monedas fiat. Tus transacciones son directamente con nosotros, por eso son rápidas y sin complicaciones, eliminando intermediarios innecesarios.',
    },
    {
      question: '¿Es seguro usar TuCapi?',
      answer:
        'Absolutamente. La seguridad es nuestra principal prioridad. Implementamos rigurosos procesos de verificación de usuarios  para proteger cada transacción. Además, estamos registrados en la MSB (FINTRAC) para fomentar una comunidad transparente y confiable.',
    },
    {
      question: '¿Qué monedas puedo intercambiar?',
      answer:
        'Actualmente, TuCapi facilita el intercambio entre PayPal y USDT (Tether) en la red de tu preferencia, y/o Bolívares (BS). Estamos trabajando constantemente para expandir las opciones de metodos de pago y divisas en el futuro.',
    },
    {
      question: '¿Cuáles son las tarifas por usar TuCapi?',
      answer:
        'TuCapi se esfuerza por ofrecer un servicio con tarifas competitivas. Los detalles específicos de las tarifas se muestran de forma transparente antes de confirmar cualquier intercambio.',
    },
    {
      question: '¿Cuánto tiempo tardan las transacciones?',
      answer:
        'La mayoría de las transacciones en TuCapi se completan en cuestión de minutos. La velocidad puede variar ligeramente dependiendo de las confirmaciones necesarias en las redes blockchain para USDT o transacciones por completar, normalmente no demora mas de 30 minutos',
    },
    {
      question: '¿Qué pasa si tengo un problema con una transacción?',
      answer:
        'Contamos con un equipo de soporte dedicado listo para ayudarte en caso de cualquier disputa o problema. Por favor, contacta a nuestro equipo de soporte a través de la sección de contacto y te asistiremos a la brevedad.',
    },
    {
      question: '¿Cómo me registro en TuCapi?',
      answer: (
        <>
          Registrarse es fácil y rápido. Simplemente haz clic en el botón{" "}
          <Link href="/sign-up" className="text-emerald-300 hover:underline">
            &quot;Registrarse&quot;
          </Link>{" "}
          en la página de inicio y sigue los pasos. Necesitarás proporcionar algunos datos básicos y verificar tu cuenta para comenzar a operar.
        </>
      ),
    },
    {
      question: '¿Necesito verificar mi identidad?',
      answer:
        'Sí, para garantizar la seguridad de nuestra comunidad y cumplir con las regulaciones ya que estamos registrados en MSB (FINTRAC), requerimos que todos los usuarios pasen por un proceso de verificación de identidad. Esto ayuda a prevenir fraudes y a mantener un entorno de intercambio confiable.',
    },
    {
      question: '¿Cómo contacto al soporte de TuCapi?',
      answer: (
        <>
          Puedes contactar a nuestro equipo de soporte a través de la sección de{" "}
          <Link href="/contact" className="text-emerald-300 hover:underline">
            &quot;Contacto&quot;
          </Link>{" "}
          en nuestro sitio web. Estamos disponibles las 24 horas del día, los 7 días de la semana para responder tus preguntas y ayudarte con cualquier inconveniente.
        </>
      ),
    },
    {
      question: '¿Puedo usar TuCapi en mi dispositivo móvil?',
      answer:
        'Sí, TuCapi está diseñado para ser completamente responsivo y accesible desde cualquier dispositivo con conexión a internet, incluyendo smartphones y tablets. Puedes acceder a todas las funcionalidades de la plataforma desde tu navegador móvil.',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white py-20 px-6 relative overflow-hidden">
      {/* Fondo con degradado sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-80 z-0"></div>
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-tight mb-4 drop-shadow-md animate-slideInDown">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl font-light text-gray-300 mb-6 animate-fadeIn delay-200">
            Encuentra respuestas rápidas a tus dudas más comunes sobre TuCapi.
          </p>
        </header>

        <section className="bg-gray-800 bg-opacity-70 rounded-xl shadow-lg p-8">
          <ul className="space-y-6">
            {faqs.map((faq, index) => (
              <li key={index} className="border-b border-gray-700 pb-6 last:border-b-0">
                <h2
                  className="text-xl font-semibold text-emerald-300 mb-2 cursor-pointer transition-colors duration-300 hover:text-teal-200 animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {faq.question}
                </h2>
                <p
                  className="text-gray-400 leading-relaxed animate-fadeIn"
                  style={{ animationDelay: `${index * 100 + 100}ms` }}
                >
                  {faq.answer}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-center mt-12 text-gray-500 text-sm relative z-10 animate-fadeInUp delay-500">
          ¿No encontraste tu respuesta?{" "}
          <Link href="/contact" className="text-emerald-300 hover:underline">
            Contáctanos
          </Link>
          .
        </footer>
      </div>
    </main>
  );
};

export default FaqPage;