'use client';

import { useState } from 'react';

export function usePushSubscription() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function setError(msg: string) {
    setErrorMessage(msg);
    setStatus('error');
  }

  async function subscribe() {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setError('Tu navegador no soporta notificaciones');
      return;
    }

    if (Notification.permission === 'denied') {
      setErrorMessage(null);
      setStatus('denied');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      // serviceWorker.ready with 10s timeout
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
      ]).catch((err: Error) => {
        throw err.message === 'timeout'
          ? Object.assign(new Error('No se pudo conectar al service worker'), { tag: 'sw-timeout' })
          : err;
      });

      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setErrorMessage('Permiso de notificaciones denegado');
        setStatus('denied');
        return;
      }
      if (permission === 'default') {
        setStatus('idle');
        return;
      }

      const existing = await (
        registration as ServiceWorkerRegistration
      ).pushManager.getSubscription();
      const subscription =
        existing ??
        (await (registration as ServiceWorkerRegistration).pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      let res: Response;
      try {
        res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, keys }),
        });
      } catch {
        setError('Error de red al guardar la suscripción');
        return;
      }

      if (res.ok) {
        setStatus('subscribed');
      } else {
        setError('No se pudo guardar la suscripción en el servidor');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    }
  }

  async function unsubscribe() {
    try {
      setStatus('loading');
      setErrorMessage(null);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus('idle');
    } catch {
      setError('No se pudo desactivar la suscripción');
    }
  }

  return { status, errorMessage, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
