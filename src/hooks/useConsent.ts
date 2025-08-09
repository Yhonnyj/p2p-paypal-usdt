'use client';

import { useEffect, useState } from 'react';

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
};

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem('tucapi_consent');
        setConsent(raw ? JSON.parse(raw) : null);
      } catch {
        setConsent(null);
      }
    };

    read();
    const handler = (e: any) => setConsent(e.detail);
    window.addEventListener('consent:changed', handler as any);
    return () => window.removeEventListener('consent:changed', handler as any);
  }, []);

  return consent;
}
