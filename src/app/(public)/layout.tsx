// app/(public)/layout.tsx
'use client'; // Este layout debe ser un Client Component porque el Navbar lo es.

import Navbar from '@/components/Navbar'; // Ajusta la ruta si es necesario (asumiendo components está un nivel arriba de app)

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar /> {/* <-- Aquí colocamos tu Navbar premium */}
      <div className="pt-20"> {/* <-- Añade padding-top para evitar que el contenido quede bajo el Navbar fijo */}
        {children}
      </div>
    </>
  );
}