// app/(public)/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo con degradado y formas sutiles para un efecto premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0"></div>
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 z-0"></div>

      <section className="text-center mb-20 relative z-10 p-4 max-w-6xl w-full pt-24 md:pt-32"> {/* Ajuste de padding superior para dejar espacio al Navbar */}
        {/* Título y Subtítulo - Aún más impactantes y centrales sin el logo */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-none mb-6 drop-shadow-lg animate-slideInUp">
          Tu Dinero. Tu Control.
        </h1>
        <p className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-200 max-w-5xl mx-auto mb-12 leading-relaxed animate-fadeIn delay-300">
          Convierte <strong className="font-bold text-emerald-200">PayPal</strong> a <strong className="font-bold text-emerald-200">USDT</strong> y <strong className="font-bold text-emerald-200">Bolívares</strong> de forma instantánea, segura y sin fricciones. Tu puente directo al mundo crypto.
        </p>

        {/* Botones - Con más punch y una pequeña separación visual */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
          <Link href="/sign-in" passHref legacyBehavior>
            <a className="relative px-12 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">Iniciar Sesión</span>
            </a>
          </Link>
          <Link href="/sign-up" passHref legacyBehavior>
            <a className="relative px-12 py-4 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden">
              <span className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 group-hover:text-white">Regístrate Ahora</span>
            </a>
          </Link>
        </div>
      </section>

      {/* Sección de Beneficios - Minimalista y Potente (sin cambios) */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 mt-28 mb-24 px-4 relative z-10">
        {[
          { title: 'Seguridad Blindada', desc: 'Protegemos cada transacción con tecnología de cifrado avanzada.' },
          { title: 'Velocidad Rayo', desc: 'Intercambios instantáneos para que no pierdas ni un segundo.' },
          { title: 'Soporte 24/7', desc: 'Siempre a tu lado para resolver cualquier duda o problema.' }
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-700 flex flex-col items-center text-center transition-all duration-300 ease-out-quart hover:bg-emerald-900 hover:shadow-2xl hover:border-emerald-600 animate-slideIn"
            style={{ animationDelay: `${index * 150}ms` }} // Retraso de animación para cada tarjeta
          >
            {/* Iconos más prominentes y estéticos */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-5 rounded-full mb-6 shadow-md">
              {index === 0 && <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm0-11V9a2 2 0 012-2h4a2 2 0 012 2v2M9 13.5l3 3m0 0l3-3"></path></svg>}
              {index === 1 && <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
              {index === 2 && <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18.364 5.636l-3.536 3.536m0 0a3 3 0 10-4.243 4.243m4.243-4.243L14.828 8.172m-3.536 3.536a3 3 0 10-4.243 4.243m4.243-4.243L8.172 14.828m0 0L4.636 18.364m15-4.243c.123.013.245.025.364.025A6 6 0 0122 12c0-3.313-2.687-6-6-6A6 6 0 0110 0c-3.313 0-6 2.687-6 6a6 6 0 016 6c0 1.657-.672 3.155-1.757 4.243"></path></svg>}
            </div>
            <h3 className="text-2xl font-bold text-emerald-300 mb-3">{item.title}</h3>
            <p className="text-lg text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Llamada a la Acción Final - Con más fuerza (sin cambios) */}
      <section className="w-full text-center bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-16 rounded-xl shadow-2xl max-w-4xl mb-12 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight animate-fadeInUp">
          ¡Tu Cambio perfecto, comienza aquí!
        </h2>
        <p className="text-xl md:text-2xl font-light mb-8 opacity-90 animate-fadeInUp delay-200">
          Únete a TuCapi y experimenta la evolución de los intercambios P2P.
        </p>
        <Link href="/sign-up" passHref legacyBehavior>
          <a className="relative px-16 py-5 rounded-full bg-white text-emerald-700 font-bold text-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden">
            <span className="absolute inset-0 bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">Regístrate Hoy</span>
          </a>
        </Link>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-10 mb-4 relative z-10">
        &copy; {new Date().getFullYear()} TuCapi. Todos los derechos reservados.
      </footer>
    </main>
  );
}