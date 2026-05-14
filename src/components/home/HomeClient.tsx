'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Trophy, X, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelCard } from '@/components/ui/LevelCard';
import { getFraseDelDia } from '@/constants/phrases';

type Props = {
  userName: string;
  day: number;
  month: number;
  year: number;
  streak: { current: number; best: number };
  todayCompleted: boolean;
  completedDays: number[];
  visionText?: string | null;
  strategyText?: string | null;
};

const DAYS_IN_MAY = 31;
const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
// 1 May 2026 = Friday → offset 4 (L=0)
const MAY_2026_OFFSET = 4;

function parsePlanText(text: string | null | undefined): { label: string; passage: string } | null {
  if (!text) return null;
  const sepIdx = text.indexOf('||');
  if (sepIdx === -1) return { label: '', passage: text.trim() };
  const label = text.slice(0, sepIdx).trim();
  const passage = text.slice(sepIdx + 2).trim();
  return { label, passage };
}

export function HomeClient({
  userName,
  day,
  streak,
  todayCompleted,
  completedDays,
  visionText,
  strategyText,
}: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const days = Array.from({ length: DAYS_IN_MAY }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      {/* Saludo + botón de video */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-muted text-sm">Buenos días 👋</p>
          <h1 className="text-3xl font-extrabold">{userName}</h1>
        </div>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setVideoOpen(true)}
          aria-label="Consejos para tu devocional"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm"
        >
          <PlayCircle size={22} className="text-[var(--color-primary)]" />
          <span className="max-w-[60px] text-center text-[10px] leading-tight font-semibold text-[var(--color-muted)]">
            Consejos
          </span>
        </motion.button>
      </motion.div>

      {/* Racha card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-2xl bg-[var(--color-primary)] p-6 text-white shadow-lg"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">Racha actual</p>
            <div className="flex items-end gap-1">
              <span className="text-6xl leading-none font-black">{streak.current}</span>
              <span className="mb-2 text-lg text-blue-200">días</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-blue-300">
              <Trophy size={14} />
              <span className="text-sm">Mejor racha: {streak.best} días</span>
            </div>
          </div>
          <div className="text-5xl" style={{ animation: 'var(--animate-flame)' }}>
            🔥
          </div>
        </div>
      </motion.div>

      {/* Nivel card */}
      <LevelCard />

      {/* CTA devocional */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Link href={`/devotional/${day}`}>
          <motion.div
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex items-center justify-between rounded-2xl p-5 shadow-sm transition-colors',
              todayCompleted
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-primary)] text-white',
            )}
          >
            <div>
              <p className="text-sm font-medium opacity-80">Día {day} de Mayo</p>
              <p className="text-base font-bold">
                {todayCompleted ? '✓ Devocional completado ✨' : 'Comenzar devocional de hoy'}
              </p>
            </div>
            {!todayCompleted && <ChevronRight size={22} />}
          </motion.div>
        </Link>
      </motion.div>

      {/* Frase del día */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h2 className="font-bold text-blue-900 dark:text-blue-200">Frase del día</h2>
        </div>
        <p className="text-sm leading-relaxed text-blue-800 italic dark:text-blue-300">
          {getFraseDelDia()}
        </p>
      </motion.div>

      {/* Visión del mes */}
      {(() => {
        const vision = parsePlanText(visionText);
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🌎</span>
              <h2 className="font-bold text-blue-900 dark:text-blue-200">
                Visión{vision?.label ? ` ${vision.label}` : ''}
              </h2>
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {vision?.passage || '🙏 La visión de este mes estará disponible pronto.'}
            </p>
          </motion.div>
        );
      })()}

      {/* Estrategia del mes */}
      {(() => {
        const strategy = parsePlanText(strategyText);
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🧭</span>
              <h2 className="font-bold text-amber-900 dark:text-amber-200">
                Estrategia del mes{strategy?.label ? `: ${strategy.label}` : ''}
              </h2>
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {strategy?.passage || '📌 La estrategia de este mes estará disponible pronto.'}
            </p>
          </motion.div>
        );
      })()}

      {/* Calendario Mayo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="border-border bg-surface rounded-2xl border p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Mayo 2026</h2>
          <span className="text-muted text-sm">
            {completedDays.length}/{DAYS_IN_MAY}
          </span>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center">
          {WEEK_LABELS.map((d) => (
            <span key={d} className="text-muted text-xs font-semibold">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {/* Espaciado para el offset del mes */}
          {Array.from({ length: MAY_2026_OFFSET }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}
          {days.map((d) => {
            const done = completedDays.includes(d);
            const isToday = d === day;
            return (
              <Link key={d} href={`/devotional/${d}`} className="flex justify-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isToday && !done && 'bg-primary text-white',
                    done && 'bg-success text-white',
                    !isToday && !done && 'text-muted hover:bg-border',
                  )}
                >
                  {d}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Modal: Consejos para tu devocional */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            key="video-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 pt-12 pb-24"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              key="video-modal"
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-bold text-white">Consejos para tu devocional</p>
                <button
                  onClick={() => setVideoOpen(false)}
                  aria-label="Cerrar video"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video */}
              <video
                src="/videos/pasos_para_un_devocional.mp4"
                controls
                autoPlay
                playsInline
                className="w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
