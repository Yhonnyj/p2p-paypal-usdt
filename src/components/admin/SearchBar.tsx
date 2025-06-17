// components/admin/SearchBar.tsx

"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="mb-8">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar órdenes por nombre, email, PayPal o wallet..."
        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-lg"
      />
    </div>
  );
}
