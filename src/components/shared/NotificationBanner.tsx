'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window))
    return false;
  if (Notification.permission === 'denied') return false;
  if (localStorage.getItem('ict-notification-subscribed')) return false;
  // If already granted, auto-subscribe handles it silently — no need to show banner
  if (Notification.permission === 'granted') return false;

  // Show at most once per day
  const shownDate = localStorage.getItem('ict-notification-shown-date');
  if (shownDate === todayKey()) return false;

  return true;
}

export function NotificationBanner() {
  const { status } = useSession();
  const { subscribe } = usePushSubscription();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const id = setTimeout(() => {
      // If permission already granted but not subscribed, re-subscribe silently
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        !localStorage.getItem('ict-notification-subscribed')
      ) {
        subscribe().catch(() => {});
        return;
      }
      if (shouldShow()) {
        // Mark as shown today so it doesn't appear again in the same day
        localStorage.setItem('ict-notification-shown-date', todayKey());
        setVisible(true);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [status, subscribe]);

  function handleDismiss() {
    setVisible(false);
  }

  async function handleActivate() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribe();
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-primary fixed right-4 bottom-20 left-4 z-50 rounded-2xl p-5 shadow-xl"
        >
          <p className="mb-1 text-center text-base font-bold text-white">🔔 Recordatorio diario</p>
          <p className="mb-4 text-center text-sm text-white/80">
            Activa las notificaciones para recibir tu recordatorio devocional cada día a la hora que
            elijas.
          </p>
          <button
            onClick={handleActivate}
            className="text-primary mb-2 w-full rounded-xl bg-white py-3 font-semibold"
          >
            Activar notificaciones
          </button>
          <button onClick={handleDismiss} className="w-full py-2 text-sm text-white/70">
            Ahora no
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
