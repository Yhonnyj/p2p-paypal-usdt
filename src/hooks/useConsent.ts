'use client';

import { useEffect, useState } from 'react';

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
};

type ConsentChangedEvent = CustomEvent<ConsentState>;

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem('tucapi_consent');
        const parsed = raw ? (JSON.parse(raw) as ConsentState) : null;
        setConsent(parsed);
      } catch {
        setConsent(null);
      }
    };

    read();

    const handler = (e: Event) => {
      const detail = (e as ConsentChangedEvent).detail;
      setConsent(detail ?? null);
    };

    window.addEventListener('consent:changed', handler);
    return () => window.removeEventListener('consent:changed', handler);
  }, []);

  return consent;
}
