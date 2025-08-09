'use client';

import { useEffect, useState } from 'react';
import { getStoredConsent } from '@/components/CookieConsent';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export default function AnalyticsGate() {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    const saved = getStoredConsent();
    setAllow(!!saved?.analytics);

    const onChange = (e: any) => setAllow(!!e.detail?.analytics);
    window.addEventListener('consent:changed', onChange as any);
    return () => window.removeEventListener('consent:changed', onChange as any);
  }, []);

  if (!allow) return null;
  // Renderiza tu componente actual de GA solo si hay consentimiento
  return <GoogleAnalytics />;
}
