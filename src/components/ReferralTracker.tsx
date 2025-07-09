// components/ReferralTracker.tsx
'use client';

import { useEffect } from 'react';

export default function ReferralTracker() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('r');

    if (ref && !document.cookie.includes('referrerId=')) {
      // Guardar cookie por 30 días
      document.cookie = `referrerId=${ref}; path=/; max-age=${60 * 60 * 24 * 30}`;
    }
  }, []);

  return null;
}
