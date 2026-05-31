'use client';

import { useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribePushInBackground(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  )
    return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = (await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
    ])) as ServiceWorkerRegistration;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    // Always verify the browser subscription is still alive before trusting localStorage
    const existing = await registration.pushManager.getSubscription();
    if (!existing) {
      // Subscription is gone (cleared storage, expired, reinstalled) — reset the flag
      localStorage.removeItem('ict-notification-subscribed');
    } else if (localStorage.getItem('ict-notification-subscribed')) {
      // Subscription exists in browser and we previously saved it to the server → skip re-upload
      return true;
    }

    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, keys }),
    });

    if (res.ok) {
      localStorage.setItem('ict-notification-subscribed', '1');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

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
      const permission =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();

      if (permission === 'denied') {
        setErrorMessage('Permiso de notificaciones denegado');
        setStatus('denied');
        return;
      }
      if (permission === 'default') {
        setStatus('idle');
        return;
      }

      const success = await subscribePushInBackground();
      if (success) {
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
      localStorage.removeItem('ict-notification-subscribed');
      setStatus('idle');
    } catch {
      setError('No se pudo desactivar la suscripción');
    }
  }

  return { status, errorMessage, subscribe, unsubscribe };
}
