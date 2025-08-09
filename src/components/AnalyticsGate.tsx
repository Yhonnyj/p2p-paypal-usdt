'use client';

import { useEffect, useState } from 'react';
import { getStoredConsent } from '@/components/CookieConsent';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

type ConsentDetail = { analytics?: boolean };
type ConsentChangedEvent = CustomEvent<ConsentDetail>;

export default function AnalyticsGate() {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    const saved = getStoredConsent() as Partial<ConsentDetail> | null;
    setAllow(!!saved?.analytics);

    const handler = (e: Event) => {
      const detail = (e as ConsentChangedEvent).detail;
      setAllow(!!detail?.analytics);
    };

    window.addEventListener('consent:changed', handler);
    return () => window.removeEventListener('consent:changed', handler);
  }, []);

  if (!allow) return null;
  return <GoogleAnalytics />;
}
