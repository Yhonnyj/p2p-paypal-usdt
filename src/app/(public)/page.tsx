import Link from 'next/link';
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WarningBanner from "@/components/WarningBanner";

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    if (userId === ADMIN_ID) {
      redirect("/admin/orders");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      {/* 🧠 Ahora el fondo proviene del layout */}
      <WarningBanner />

      {/* VELOCIDAD + CONFIANZA */}
      <section className="w-full max-w-6xl flex justify-center items-center gap-8 text-center text-sm text-emerald-300 mb-8 relative z-10 pt-20">
        <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-bold">SOPORTE EN VIVO</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-gray-800/60 px-4 py-2 rounded-full border border-gray-600">
          <span className="text-emerald-400">⚡</span>
          <span>Promedio: 8 minutos</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/60 px-4 py-2 rounded-full border border-gray-600">
          <span className="text-yellow-400">🏆</span>
          <span>+2,500 intercambios</span>
        </div>
      </section>

      {/* HERO */}
      <section className="text-center mb-16 relative z-10 p-4 max-w-6xl w-full">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-none mb-6 drop-shadow-lg animate-slideInUp">
          De PayPal a tu cuenta en minutos, no en días
        </h1>

        <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-200 max-w-4xl mx-auto mb-6 leading-relaxed animate-fadeIn delay-300">
          El intercambio <strong className="font-bold text-emerald-200">más rápido del mercado</strong>. Convierte tu PayPal a <strong className="font-bold text-emerald-200">USDT</strong> o <strong className="font-bold text-emerald-200">Bolívares</strong> con el mejor soporte del mercado.
        </p>

        {/* BADGES */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2 rounded-full text-white font-bold text-sm shadow-lg">
            ⚡ INTERCAMBIO RÁPIDO
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2 rounded-full text-white font-bold text-sm shadow-lg">
            🚀 SOPORTE INSTANTÁNEO
          </div>
          <div className="bg-gradient-to-r from-orange-600 to-indigo-600 px-6 py-2 rounded-full text-white font-bold text-sm shadow-lg">
            ✅ 3 CLICS Y LISTO
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
          <Link href="/sign-in" passHref legacyBehavior>
            <a className="relative px-12 py-4 rounded-full bg-gray-800 text-emerald-300 border-2 border-emerald-600 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden">
              <span className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 group-hover:text-white">Ya tengo cuenta</span>
            </a>
          </Link>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="w-full max-w-6xl mb-20 px-4 relative z-10">
        <h2 className="text-4xl font-bold text-center text-emerald-300 mb-4">¿Por qué eligen TuCapi?</h2>
        <p className="text-center text-gray-400 mb-12 text-lg">Mientras otros te hacen esperar, nosotros ya te pagamos</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Freelancers', desc: 'Convierte tus pagos de clientes en tu PayPal sin perder tiempo esperando', time: '8 min promedio', icon: '💼' },
            { title: 'Vendedores Online', desc: 'Transforma tus ventas de PayPal a crypto o bolívares al instante', time: '8 min promedio', icon: '🛒' },
            { title: 'Profesionales', desc: 'Recibe y convierte tu PayPal con el mejor soporte', time: '9 min promedio', icon: '👨‍💼' }
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 text-center hover:border-emerald-600 transition-all duration-300 hover:bg-gray-800 group"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-emerald-300 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{item.desc}</p>
              <div className="text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-600/30">
                ⚡ {item.time}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 mt-8 mb-24 px-4 relative z-10">
        {[
          { title: 'Velocidad Extrema', desc: 'Procesamos tu intercambio en minutos. El más rápido del mercado.', details: 'Promedio: 8 min • Sin colas • Sin demoras', icon: '⚡' },
          { title: 'Súper Fácil', desc: '3 clics y listo. La plataforma más simple que hayas usado.', details: 'Sin formularios largos • Interfaz intuitiva', icon: '🎯' },
          { title: 'Soporte Rayo', desc: 'Respuesta inmediata. Humanos reales que solucionan todo.', details: 'Chat en vivo • < 2 min • 9am - 9pm', icon: '💬' }
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-700 flex flex-col items-center text-center transition-all duration-300 ease-out-quart hover:bg-emerald-900 hover:shadow-2xl hover:border-emerald-600 animate-slideIn group"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-6 rounded-full mb-6 shadow-md text-3xl group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold text-emerald-300 mb-3">{item.title}</h3>
            <p className="text-lg text-gray-400 leading-relaxed mb-4">{item.desc}</p>
            <div className="text-xs text-emerald-400 bg-gray-700/50 px-4 py-2 rounded-full border border-emerald-600/30">
              {item.details}
            </div>
          </div>
        ))}
      </section>

      {/* TESTIMONIOS */}
      <section className="w-full max-w-6xl mb-20 px-4 relative z-10">
        <h2 className="text-3xl font-bold text-center text-emerald-300 mb-4">La velocidad que nuestros usuarios aman</h2>
        <p className="text-center text-gray-400 mb-12">Experiencias reales de intercambios rápidos</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Carlos M.", role: "Freelancer Web", text: "En 8 minutos tenía mi USDT en la wallet. Otros me hacían esperar horas.", rating: 5, time: "8 min" },
            { name: "María S.", role: "Diseñadora", text: "El soporte me respondió antes de que terminara de escribir. Increíble.", rating: 5, time: "< 1 min soporte" },
            { name: "José R.", role: "Consultor", text: "5 minutos y ya tenía mis bolívares. La rapidez es brutal.", rating: 5, time: "5 min" }
          ].map((testimonial, index) => (
            <div key={index} className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 hover:border-emerald-600 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                ⚡ {testimonial.time}
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
              <div className="text-sm">
                <div className="text-emerald-300 font-semibold">{testimonial.name}</div>
                <div className="text-gray-400">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INFO + CTA FINAL */}
      <section className="w-full max-w-6xl mb-20 px-4 relative z-10">
        <div className="bg-gradient-to-r from-gray-800/80 to-emerald-900/40 backdrop-blur-sm border border-emerald-600 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-center text-emerald-300 mb-6">Todo lo que necesitas saber</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div><div className="text-xl font-bold text-emerald-400 mb-1">$4 - $3K</div><div className="text-xs text-gray-400">Por intercambio</div></div>
            <div><div className="text-xl font-bold text-emerald-400 mb-1">3-10 min</div><div className="text-xs text-gray-400">Tiempo promedio</div></div>
            <div><div className="text-xl font-bold text-emerald-400 mb-1">9am - 9pm</div><div className="text-xs text-gray-400">Disponibles</div></div>
            <div><div className="text-xl font-bold text-emerald-400 mb-1">0%</div><div className="text-xs text-gray-400">Comisiones PayPal</div></div>
          </div>
        </div>
      </section>

      <section className="w-full text-center bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-16 rounded-xl shadow-2xl max-w-4xl mb-12 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-400/20 animate-pulse"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight animate-fadeInUp">
            ¿Listo para el intercambio más rápido?
          </h2>
          <p className="text-xl md:text-2xl font-light mb-2 opacity-90 animate-fadeInUp delay-200">
            Únete a +1,500 usuarios que ya disfrutan de velocidad extrema
          </p>
          <p className="text-sm mb-8 opacity-80">
            Promedio de intercambio: 8 minutos • Soporte: 2 minutos
          </p>
          <Link href="/sign-up" passHref legacyBehavior>
            <a className="relative inline-block px-16 py-5 rounded-full bg-white text-emerald-700 font-bold text-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden">
              <span className="absolute inset-0 bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">🚀 Empezar Ya - Es Gratis</span>
            </a>
          </Link>
        </div>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-10 mb-4 relative z-10 space-y-2 max-w-4xl">
        <p>&copy; {new Date().getFullYear()} Tu Capi LLC. El intercambio más rápido del mercado.</p>
        <div className="space-x-4">
          <a href="/terms" className="underline hover:text-emerald-400 transition-colors">Términos</a>
          <span>|</span>
          <a href="/privacy" className="underline hover:text-emerald-400 transition-colors">Privacidad</a>
        </div>
        <div className="mt-6 text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
          <p>Tu Capi LLC, contrata los servicios de Caibo Inc., registrada ante FINTRAC (MSB) C100000990 desde Octubre de 2025, para la prestación de servicios de intercambio de divisas tradicionales y monedas virtuales conforme a las regulaciones AML/CFT de Canadá.</p> 
        </div>
      </footer>
    </main>
  );
}
