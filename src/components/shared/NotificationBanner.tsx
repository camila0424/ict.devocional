'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'default') return false;
  if (localStorage.getItem('ict-notification-subscribed')) return false;

  const dismissed = localStorage.getItem('ict-notification-dismissed');
  if (dismissed) {
    const diff = Date.now() - parseInt(dismissed);
    if (diff < 7 * 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

export function NotificationBanner() {
  const { status } = useSession();
  const { subscribe } = usePushSubscription();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const id = setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        !localStorage.getItem('ict-notification-subscribed')
      ) {
        subscribe().then(() => {
          localStorage.setItem('ict-notification-subscribed', 'true');
        });
        return;
      }
      setVisible(shouldShow());
    }, 2000);
    return () => clearTimeout(id);
  }, [status, subscribe]);

  function handleDismiss() {
    localStorage.setItem('ict-notification-dismissed', Date.now().toString());
    setVisible(false);
  }

  async function handleActivate() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribe();
      localStorage.setItem('ict-notification-subscribed', 'true');
    } else {
      localStorage.setItem('ict-notification-dismissed', Date.now().toString());
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
          className="bg-primary fixed right-4 bottom-20 left-4 z-50 rounded-2xl p-4 shadow-xl"
        >
          <p className="mb-3 text-center text-base font-semibold text-white">
            🔔 Activa las notificaciones
          </p>
          <button
            onClick={handleActivate}
            className="text-primary mb-2 w-full rounded-xl bg-white py-3 font-semibold"
          >
            Activar
          </button>
          <button onClick={handleDismiss} className="w-full py-2 text-sm text-white/70">
            Ahora no
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
