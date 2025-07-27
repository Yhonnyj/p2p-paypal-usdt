// components/ReferralTracker.tsx
'use client';

import { useEffect } from 'react';

export default function ReferralTracker() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('r');

    if (ref) {
      // Guardar en localStorage para que SignUpPage lo use
      localStorage.setItem('referrerId', ref);
      console.log('Referrer ID guardado:', ref);
    }
  }, []);

  return null;
}
