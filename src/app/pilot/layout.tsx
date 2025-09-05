// src/app/pilot/layout.tsx
export default function PilotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-gray-100">
      {children}
    </div>
  );
}
