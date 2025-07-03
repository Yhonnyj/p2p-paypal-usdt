'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md z-50 shadow-lg py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo de la marca */}
        <Link href="/" passHref legacyBehavior>
          <a className="flex items-center space-x-2 sm:space-x-3 group">
            <Image
              src="/tu-capi-logo2.png"
              alt="Logo TuCapi"
              width={60}
              height={60}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-emerald-500 transform group-hover:scale-110 transition-transform duration-200"
            />
            <Image
              src="/tu-capi-letras.png"
              alt="TuCapi Letras"
              width={120}
              height={40}
              className="w-24 sm:w-32 transform group-hover:scale-105 transition-transform duration-200"
            />
          </a>
        </Link>

        {/* Menú de navegación principal (escritorio) */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors font-medium text-base sm:text-lg relative group">
              Inicio
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
          <Link href="/faq" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors font-medium text-base sm:text-lg relative group">
              Preguntas Frecuentes
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
          <Link href="/contact" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors font-medium text-base sm:text-lg relative group">
              Contacto
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
        </div>

        {/* Botones de acción (escritorio) */}
        <div className="hidden md:flex space-x-3">
          <Link href="/sign-in" passHref legacyBehavior>
            <a className="px-4 py-2 sm:px-6 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-semibold text-sm sm:text-base hover:bg-emerald-600 hover:text-white transition-all shadow-md">
              Iniciar Sesión
            </a>
          </Link>
          <Link href="/sign-up" passHref legacyBehavior>
            <a className="px-4 py-2 sm:px-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-sm sm:text-base hover:from-emerald-700 hover:to-teal-600 transition-all shadow-md">
              Registrarse
            </a>
          </Link>
        </div>

        {/* Botón de hamburguesa */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-95 px-6 py-4 mt-2 border-t border-gray-700">
          <div className="flex flex-col space-y-4">
            <Link href="/" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-emerald-300 text-lg font-medium">Inicio</a>
            </Link>
            <Link href="/faq" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-emerald-300 text-lg font-medium">Preguntas Frecuentes</a>
            </Link>
            <Link href="/contact" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-emerald-300 text-lg font-medium">Contacto</a>
            </Link>
            <div className="pt-4 border-t border-gray-700">
              <Link href="/sign-in" passHref legacyBehavior>
                <a onClick={() => setIsOpen(false)} className="block w-full text-center px-6 py-3 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-semibold mb-2 hover:bg-emerald-600 hover:text-white transition-all">
                  Iniciar Sesión
                </a>
              </Link>
              <Link href="/sign-up" passHref legacyBehavior>
                <a onClick={() => setIsOpen(false)} className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold hover:from-emerald-700 hover:to-teal-600 transition-all">
                  Registrarse
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
