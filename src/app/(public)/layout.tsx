'use client';

import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showHalloweenIcons, setShowHalloweenIcons] = useState(false);

  useEffect(() => {
    const today = new Date();
    const active =
      today.getMonth() === 9 && today.getDate() >= 18 && today.getDate() <= 31;
    setShowHalloweenIcons(active);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col text-white font-inter transition-all duration-700 bg-gray-950 overflow-hidden">
      {/* 🌌 Fondo premium con blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-90 z-0" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply blur-xl opacity-30 animate-blob animation-delay-4000 z-0" />

      {/* 👻🎃🕸️ Decoraciones flotantes (solo visibles en Halloween) */}
      {showHalloweenIcons && (
        <>
          {/* Lado izquierdo */}
          <div className="absolute top-1/4 left-4 text-5xl float-emoji opacity-90">🎃</div>
          <div className="absolute bottom-1/4 left-6 text-5xl float-emoji-slow opacity-85">👻</div>
          <div className="absolute bottom-8 left-12 text-6xl opacity-60 rotate-180">🕸️</div>
          <div className="absolute top-8 left-10 text-6xl opacity-60 rotate-12">🕸️</div>

          {/* Lado derecho */}
          <div className="absolute top-1/3 right-10 text-5xl float-emoji-slow opacity-85">🎃</div>
          <div className="absolute bottom-12 right-8 text-5xl float-emoji opacity-90">👻</div>
          <div className="absolute bottom-0 right-4 text-6xl opacity-60 -rotate-180">🕸️</div>
          <div className="absolute top-4 right-12 text-6xl opacity-50 -rotate-12">🕸️</div>

          {/* Centro inferior */}
          <div className="absolute bottom-4 left-1/3 text-4xl opacity-70 float-emoji">🎃</div>
          <div className="absolute bottom-4 right-1/3 text-4xl opacity-70 float-emoji">🎃</div>
        </>
      )}

      {/* Contenido principal */}
      <Navbar />
      <div className="pt-20 relative z-10">{children}</div>

      {/* ✅ Animaciones globales */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-20px) rotate(-2deg); }
        }
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 12s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .float-emoji {
          animation: float 6s ease-in-out infinite;
        }
        .float-emoji-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
