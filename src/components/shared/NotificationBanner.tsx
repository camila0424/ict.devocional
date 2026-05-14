'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from 'next-auth/react';
import { subscribePushInBackground } from '@/hooks/usePushSubscription';

const DISMISSED_KEY = 'ict-notification-dismissed';
const SUBSCRIBED_KEY = 'ict-notification-subscribed';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  console.log('Permission:', Notification.permission);
  console.log('Standalone:', isStandalone);
  console.log('Subscribed:', localStorage.getItem(SUBSCRIBED_KEY));
  console.log('Dismissed:', localStorage.getItem(DISMISSED_KEY));

  if (localStorage.getItem(SUBSCRIBED_KEY)) return false;

  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed && Date.now() - Number(dismissed) <= SEVEN_DAYS_MS) return false;

  if (isStandalone) return true;

  if (Notification.permission !== 'default') return false;

  return !dismissed || Date.now() - Number(dismissed) > SEVEN_DAYS_MS;
}

export function NotificationBanner() {
  const { status: sessionStatus } = useSession();
  const [visible, setVisible] = useState(false);
  const [isStandalone] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false,
  );

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    const delay = isStandalone ? 1000 : 0;
    const id = setTimeout(() => {
      setVisible(shouldShow());
    }, delay);

    return () => clearTimeout(id);
  }, [sessionStatus]);

  async function handleActivate() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribePushInBackground();
    } else if (permission === 'denied') {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ delay: isStandalone ? 1 : 2, type: 'spring', damping: 25 }}
          className="fixed right-0 bottom-0 left-0 z-50 bg-[#1E40AF] px-5 pt-6 pb-8 shadow-2xl"
        >
          <div className="mx-auto max-w-sm text-center">
            <div className="mb-3 text-4xl">🔔</div>
            <h2 className="text-lg font-bold text-white">Activa las notificaciones</h2>
            <button
              onClick={handleActivate}
              className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#1E40AF]"
            >
              Activar ahora
            </button>
            <button onClick={handleDismiss} className="mt-3 w-full py-2 text-sm text-blue-300">
              Ahora no
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
