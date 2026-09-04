'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Strings } from '@/constants/strings';

/** Color del centro del logo ICT — pantalla de inicio totalmente unificada. */
const BRAND = '#1800AD';
const SESSION_KEY = 'ict-splash-shown';
/** Tiempo total en pantalla antes de empezar a desvanecer (ms). */
const HOLD_MS = 1500;

const subscribe = () => () => {};
const wasShown = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export function SplashScreen() {
  // Una sola vez por sesión: al navegar dentro de la app no se repite.
  const alreadyShown = useSyncExternalStore(subscribe, wasShown, () => false);
  const [done, setDone] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [sheepOk, setSheepOk] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* sessionStorage no disponible */
    }
  }, []);

  useEffect(() => {
    if (alreadyShown) return;
    const timer = window.setTimeout(() => setDone(true), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [alreadyShown]);

  const visible = !alreadyShown && !done;

  // Mientras el splash cubre la pantalla, la barra de estado (Android) usa el
  // mismo azul de marca: transición sin franjas de otro color.
  useEffect(() => {
    if (!visible) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.setAttribute('data-splash', '');
    meta.content = BRAND;
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ict-splash"
          aria-hidden
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: BRAND,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
        >
          {/* Halo suave para dar profundidad sin romper el color unificado */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 45% at 50% 42%, rgba(255,255,255,0.14), rgba(255,255,255,0) 70%)',
            }}
          />

          {/* Logo blanco: ya viene visible desde el ícono nativo, sin
              reaparecer — evita el parpadeo/hueco al entregar el control a React. */}
          {!logoOk && (
            <span className="relative text-5xl font-bold tracking-tight text-white">ICT</span>
          )}
          <img
            src="/splash/ict-logo-white.png"
            alt={Strings.app.name}
            width={1005}
            height={409}
            hidden={!logoOk}
            onError={() => setLogoOk(false)}
            className="relative h-auto w-[70vw] max-w-75 select-none"
            draggable={false}
          />

          {/* Saludo de bienvenida */}
          <motion.p
            className="relative mt-5 text-center text-[15px] font-medium tracking-wide text-white/80"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.4 } }}
          >
            {Strings.app.tagline}
          </motion.p>

          {/* Oveja mascota: entra saludando para recibir al usuario */}
          <motion.img
            src="/splash/oveja-saludo.png"
            alt=""
            width={582}
            height={827}
            hidden={!sheepOk}
            onError={() => setSheepOk(false)}
            className="relative mt-8 h-auto w-[34vw] max-w-40 drop-shadow-[0_12px_28px_rgba(0,0,0,0.28)] select-none"
            draggable={false}
            style={{ transformOrigin: '80% 90%' }}
            initial={{ opacity: 0, y: 48, scale: 0.85 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0, scale: 1, transition: { delay: 0.1, duration: 0.3 } }
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotate: [0, -6, 5, -4, 3, 0],
                    transition: {
                      delay: 0.05,
                      duration: 0.55,
                      ease: 'easeOut',
                      rotate: { delay: 0.55, duration: 0.7, ease: 'easeInOut' },
                    },
                  }
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
