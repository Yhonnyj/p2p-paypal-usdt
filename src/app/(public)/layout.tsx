'use client';

import Navbar from '@/components/Navbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6">{children}</main>
    </div>
  );
}
