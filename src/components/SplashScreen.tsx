"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center text-2xl font-bold animate-pulse">
        TuCapi
      </div>
    );
  }

  return <>{children}</>;
}
