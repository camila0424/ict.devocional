'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-custom.js')
        .then((reg) => console.log('SW registrado:', reg.scope))
        .catch((err) => console.error('SW error:', err));
    }
  }, []);

  return null;
}
