'use client'; // Esto es importante para componentes interactivos en Next.js App Router

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el menú móvil está abierto

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md z-50 shadow-lg py-4">
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo de la marca */}
        <Link href="/" passHref legacyBehavior>
          <a className="flex items-center space-x-3 group">
            <Image
              src="/tu-capi-logo2.png"
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

        {/* Menú de navegación principal (escritorio) */}
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

          {/* Redes Sociales (escritorio) */}
          <a href="https://www.instagram.com/tucapi.app/" target="_blank" rel="noopener noreferrer">
            <Image src="/instagram-icon.png" alt="Instagram" width={24} height={24} className="hover:scale-110 transition-transform" />
          </a>
          <a href="https://x.com/TuCapiApp" target="_blank" rel="noopener noreferrer">
            <Image src="/x-icon.png" alt="X" width={24} height={24} className="hover:scale-110 transition-transform" />
          </a>
        </div>

        {/* Botones de acción (escritorio) */}
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

        {/* Botón de Hamburguesa (móvil) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 focus:outline-none focus:text-emerald-300"
            aria-label="Toggle menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú de navegación móvil */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-90 py-4 px-6 mt-4 border-t border-gray-700 animate-slideDown">
          <div className="flex flex-col space-y-4">
            <Link href="/" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium">Inicio</a>
            </Link>
            <Link href="/faq" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium">Preguntas Frecuentes</a>
            </Link>
            <Link href="/contact" passHref legacyBehavior>
              <a onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-emerald-300 transition-colors duration-200 text-lg font-medium">Contacto</a>
            </Link>

            {/* Redes sociales (móvil) */}
            <div className="flex gap-4 pt-2">
              <a href="https://www.instagram.com/tucapi.app/" target="_blank" rel="noopener noreferrer">
                <Image src="/instagram-icon.png" alt="Instagram" width={24} height={24} className="hover:scale-110 transition-transform" />
              </a>
              <a href="https://x.com/TuCapiApp" target="_blank" rel="noopener noreferrer">
                <Image src="/x-icon.png" alt="X" width={24} height={24} className="hover:scale-110 transition-transform" />
              </a>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <Link href="/sign-in" passHref legacyBehavior>
                <a onClick={() => setIsOpen(false)} className="block w-full text-center px-6 py-3 rounded-full bg-gray-800 text-emerald-300 border border-emerald-600 font-semibold mb-2 transition-all duration-300 ease-out-quart hover:bg-emerald-600 hover:text-white">
                  Iniciar Sesión
                </a>
              </Link>
              <Link href="/sign-up" passHref legacyBehavior>
                <a onClick={() => setIsOpen(false)} className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold transition-all duration-300 ease-out-quart hover:from-emerald-700 hover:to-teal-600">
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
