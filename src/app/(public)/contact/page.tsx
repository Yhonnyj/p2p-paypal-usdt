// app/(public)/contact/page.tsx
'use client'; // Necesario porque tendrá interactividad (manejo de estado de formulario)

import React, { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      // Aquí es donde enviarías los datos a tu API o servicio externo.
      // Por ejemplo, si tienes una API Route en /api/contact:
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Limpiar formulario
      } else {
        const errorData = await response.json();
        setStatus('error');
        setMessage(errorData.message || 'Hubo un error al enviar tu mensaje. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setStatus('error');
      setMessage('Un error inesperado ocurrió. Por favor, verifica tu conexión o inténtalo más tarde.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white py-20 px-6 relative overflow-hidden flex items-center justify-center">
      {/* Fondo con degradado y formas sutiles */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-emerald-950 opacity-80 z-0"></div>
      <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob z-0"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto w-full bg-gray-800 bg-opacity-80 rounded-xl shadow-2xl p-8 md:p-12 border border-gray-700 animate-fadeInUp">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 leading-tight mb-4 drop-shadow-md">
            Contáctanos
          </h1>
          <p className="text-lg font-light text-gray-300">
            ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para escucharte.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-300 text-sm font-semibold mb-2">
              Tu Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">
              Tu Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
              placeholder="Ej: tu-correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-gray-300 text-sm font-semibold mb-2">
              Asunto
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
              placeholder="Ej: Problema con una transacción"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-gray-300 text-sm font-semibold mb-2">
              Tu Mensaje
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              required
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200 resize-y"
              placeholder="Escribe tu mensaje aquí..."
            ></textarea>
          </div>

          {status === 'loading' && (
            <p className="text-emerald-300 text-center animate-pulse">Enviando mensaje...</p>
          )}
          {status === 'success' && message && (
            <p className="text-green-400 text-center font-semibold">{message}</p>
          )}
          {status === 'error' && message && (
            <p className="text-red-400 text-center font-semibold">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full relative px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 ease-out-quart transform hover:-translate-y-1 hover:scale-105 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">
              {status === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
            </span>
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm mt-8">
          <p>También puedes enviarnos un correo directamente a:</p>
          <a href="mailto:soporte@tucapi.com" className="text-emerald-300 hover:underline">
            soporte@tucapi.com
          </a>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;