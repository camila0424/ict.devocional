'use client';

import { useEffect } from 'react';
import { subscribePushInBackground } from '@/hooks/usePushSubscription';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw-custom.js')
      .then((reg) => {
        console.log('SW registrado:', reg.scope);
        if (Notification.permission === 'granted') {
          subscribePushInBackground().catch(() => {});
        }
      })
      .catch((err) => console.error('SW error:', err));
  }, []);

  return null;
}
