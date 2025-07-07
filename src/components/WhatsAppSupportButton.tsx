'use client';

import Image from 'next/image';

export default function WhatsAppSupportButton() {
  const phoneNumber = '15068998648';
  const defaultMessage = 'Hola%2C%20necesito%20ayuda';

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${defaultMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 animate-pulse hover:scale-110 transition-transform duration-300"
    >
      <div className="w-16 h-16 rounded-full shadow-xl bg-teal-500 p-1 flex items-center justify-center">
        <Image
          src="/whatsapp-support.png"
          alt="Soporte por WhatsApp"
          width={48}
          height={48}
          priority
        />
      </div>
    </a>
  );
}
