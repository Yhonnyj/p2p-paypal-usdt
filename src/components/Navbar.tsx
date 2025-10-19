'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // 🎃 Detectar si estamos en Halloween (del 18 al 31 de octubre)
  const today = new Date();
  const isHalloween =
    today.getMonth() === 9 && today.getDate() >= 18 && today.getDate() <= 31;

  return (
  <nav
    className={`fixed top-0 left-0 w-full z-50 shadow-lg py-4 transition-all duration-700 ${
      isHalloween
        ? 'bg-gradient-to-r from-[#2A1040] via-[#3B1460] to-[#000000] bg-opacity-95 backdrop-blur-md'
        : 'bg-gradient-to-r from-[#2A1040] via-[#3B1460] to-[#000000] bg-opacity-95 backdrop-blur-md'
    }`}
  >

      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo de la marca */}
        <Link href="/" passHref legacyBehavior>
          <a className="flex items-center space-x-3 group">
            <Image
              src="/capi-witch.png"
              alt="Logo TuCapi"
              width={60}
              height={60}
              className="rounded-full border border-emerald-500 transform group-hover:scale-110 transition-transform duration-200"
            />
            <Image
              src="/tu-capi-letras.png"
              alt="TuCapi Letras"
              width={120}
              height={40}
              className="transform group-hover:scale-105 transition-transform duration-200"
            />
          </a>
        </Link>

        {/* Menú de escritorio */}
        <div className="hidden md:flex space-x-8 items-center">
          <Link href="/" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors duration-200 font-medium text-lg relative group">
              Inicio
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
          <Link href="/faq" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors duration-200 font-medium text-lg relative group">
              Preguntas Frecuentes
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
          <Link href="/contact" passHref legacyBehavior>
            <a className="text-gray-300 hover:text-emerald-300 transition-colors duration-200 font-medium text-lg relative group">
              Contacto
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300 ease-out"></span>
            </a>
          </Link>
        </div>

        {/* Botones (escritorio) */}
        <div className="hidden md:flex space-x-4">
          <Link href="/sign-in" passHref legacyBehavior>
            <a className="px-6 py-2 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-semibold transition-all duration-300 ease-out-quart hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-md">
              Iniciar Sesión
            </a>
          </Link>
          <Link href="/sign-up" passHref legacyBehavior>
            <a className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold transition-all duration-300 ease-out-quart hover:from-emerald-700 hover:to-teal-600 shadow-md">
              Registrarse
            </a>
          </Link>
        </div>

        {/* Hamburguesa (móvil) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 focus:outline-none focus:text-emerald-300"
            aria-label="Toggle menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-[#150C1F] via-[#241134] to-[#000000] bg-opacity-95 py-4 px-6 mt-4 border-t border-gray-700 animate-slideDown">
          <div className="flex flex-col space-y-4">
            <Link href="/" passHref legacyBehavior>
              <a
                onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium"
              >
                Inicio
              </a>
            </Link>
            <Link href="/faq" passHref legacyBehavior>
              <a
                onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium"
              >
                Preguntas Frecuentes
              </a>
            </Link>
            <Link href="/contact" passHref legacyBehavior>
              <a
                onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium"
              >
                Contacto
              </a>
            </Link>
            <div className="pt-4 border-t border-gray-700">
              <Link href="/sign-in" passHref legacyBehavior>
                <a
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-semibold mb-2 transition-all duration-300 ease-out-quart hover:bg-emerald-600 hover:text-white"
                >
                  Iniciar Sesión
                </a>
              </Link>
              <Link href="/sign-up" passHref legacyBehavior>
                <a
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold transition-all duration-300 ease-out-quart hover:from-emerald-700 hover:to-teal-600"
                >
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
