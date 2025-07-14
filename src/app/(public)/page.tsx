import Link from 'next/link';
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WarningBanner from "@/components/WarningBanner";

const ADMIN_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

// ⬇️ Wrapper para permitir renderizado solo del lado del cliente
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return null;
  return <>{children}</>;
};

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Fondo con degradado y formas sutiles para un efecto premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0"></div>
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 z-0"></div>

     {/* ✅ Mostrar banner */}
<WarningBanner />


      <section className="text-center mb-20 relative z-10 p-4 max-w-6xl w-full pt-24 md:pt-32">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-none mb-6 drop-shadow-lg animate-slideInUp">
          Tu dinero directo a tu wallet.
        </h1>

        <p className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-200 max-w-5xl mx-auto mb-12 leading-relaxed animate-fadeIn delay-300">
          Convierte <strong className="font-bold text-emerald-200">PayPal</strong> a <strong className="font-bold text-emerald-200">USDT</strong> o <strong className="font-bold text-emerald-200">Bolívares</strong> casi de forma instantánea, segura y sin fricciones. Tu puente directo al mundo crypto.
        </p>

        <p className="text-base sm:text-lg md:text-xl text-green-300 font-semibold mt-6 bg-gray-800/80 border border-green-600 px-6 py-5 rounded-2xl text-center shadow-xl max-w-3xl mx-auto leading-relaxed">
          En TuCapi no hay sorpresas: <strong className="text-emerald-400">nosotros cubrimos las comisiones de PayPal.</strong><br className="hidden sm:block" />
        </p>

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

      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 mt-28 mb-24 px-4 relative z-10">
        {[
          { title: 'Seguridad Blindada', desc: 'Protegemos cada transacción como nadie lo hace.' },
          { title: 'Velocidad Rayo', desc: 'Intercambios casi instantáneos para que no pierdas ni un segundo.' },
          { title: 'Soporte 24/7', desc: 'Siempre a tu lado para resolver cualquier duda o problema.' }
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-700 flex flex-col items-center text-center transition-all duration-300 ease-out-quart hover:bg-emerald-900 hover:shadow-2xl hover:border-emerald-600 animate-slideIn"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-5 rounded-full mb-6 shadow-md">
              {/* Íconos SVG condicionales */}
            </div>
            <h3 className="text-2xl font-bold text-emerald-300 mb-3">{item.title}</h3>
            <p className="text-lg text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

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

      <footer className="text-center text-gray-500 text-sm mt-10 mb-4 relative z-10 space-y-2">
        <p>
          &copy; {new Date().getFullYear()} TuCapi. Todos los derechos reservados. Operamos bajo la firma Caibo INC.
        </p>
        <div className="space-x-4">
          <a href="/terms" className="underline hover:text-emerald-400 transition-colors">Términos y Condiciones</a>
          <span>|</span>
          <a href="/privacy" className="underline hover:text-emerald-400 transition-colors">Política de Privacidad</a>
        </div>
        <div className="mt-6 text-sm text-gray-400">
          <p>Caibo INC, figura registrada ante FINTRAC (MSB) bajo el número M23238298 desde el 4 de agosto de 2023, habilitada para ofrecer servicios de cambio de divisas tradicionales y operaciones con monedas virtuales. Nuestra actividad se encuentra enmarcada dentro de la normativa vigente en materia de prevención de lavado de activos y financiamiento del terrorismo.</p>
        </div>
      </footer>
    </main>
  );
}
