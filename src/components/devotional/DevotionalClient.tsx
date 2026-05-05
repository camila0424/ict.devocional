'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

type Reading = { id: string; order: number; bookAbbr: string; bookFull: string; reference: string };

type EntryProps = {
  id: string;
  dayNumber: number;
  date: string;
  readings: Reading[];
};

type ResponseState = {
  message: string;
  promise: string;
  commandment: string;
  wrongAttitudes: string;
  teotherapy: string;
  petition: string;
  gratitude: string;
  pending: string;
  completedAt: string | null;
};

const SECTIONS: { key: keyof Omit<ResponseState, 'completedAt'>; emoji: string }[] = [
  { key: 'message', emoji: '📖' },
  { key: 'promise', emoji: '⭐' },
  { key: 'commandment', emoji: '📋' },
  { key: 'wrongAttitudes', emoji: '🔄' },
  { key: 'teotherapy', emoji: '💊' },
  { key: 'petition', emoji: '🙏' },
  { key: 'gratitude', emoji: '🙌' },
  { key: 'pending', emoji: '📝' },
];

const SECTION_TITLES = Strings.devotional.sections;
const sectionTitle = (key: keyof typeof SECTION_TITLES) => SECTION_TITLES[key];

const EMPTY_RESPONSE: ResponseState = {
  message: '',
  promise: '',
  commandment: '',
  wrongAttitudes: '',
  teotherapy: '',
  petition: '',
  gratitude: '',
  pending: '',
  completedAt: null,
};

type Props = { entry: EntryProps; initialResponse: ResponseState | null };

export function DevotionalClient({ entry, initialResponse }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<ResponseState>(initialResponse ?? EMPTY_RESPONSE);
  const [saving, setSaving] = useState(false);
  const [celebrated, setCelebrated] = useState(!!initialResponse?.completedAt);

  const sectionKeys = SECTIONS.map((s) => s.key);
  const filledCount = sectionKeys.filter((k) => responses[k].trim().length > 0).length;
  const progress = filledCount / sectionKeys.length;
  const allFilled = filledCount === sectionKeys.length;

  function set(key: keyof Omit<ResponseState, 'completedAt'>, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  async function handleComplete() {
    if (!allFilled) {
      toast.error('Completa todas las secciones para terminar');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/devotional/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEntryId: entry.id, ...responses }),
      });
      if (!res.ok) throw new Error();
      setCelebrated(true);
      toast.success('¡Devocional completado! 🔥');
      setTimeout(() => router.push('/'), 2000);
    } catch {
      toast.error('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-border sticky top-0 z-10 border-b bg-[var(--color-primary)] px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-200">Mayo 2026</p>
            <h1 className="text-lg font-bold text-white">Día {entry.dayNumber}</h1>
          </div>
          <span className="text-sm font-semibold text-blue-200">
            {filledCount}/{sectionKeys.length}
          </span>
        </div>
        {/* Barra de progreso */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 pb-10">
        {/* Lecturas */}
        <div className="border-border bg-surface rounded-2xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--color-primary)]" />
            <h2 className="font-bold">Lecturas de hoy</h2>
          </div>
          <div className="flex flex-col gap-2">
            {entry.readings.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-primary-light)] px-3 py-2.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                  {r.order}
                </span>
                <span className="font-semibold text-[var(--color-primary-dark)]">
                  {r.bookFull} {r.reference}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 8 Secciones */}
        {SECTIONS.map(({ key, emoji }, idx) => {
          const value = responses[key];
          const filled = value.trim().length > 0;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                filled ? 'bg-surface border-[var(--color-success)]' : 'border-border bg-surface',
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors',
                    filled
                      ? 'bg-[var(--color-success)] text-white'
                      : 'border-border text-muted border',
                  )}
                >
                  {filled ? '✓' : idx + 1}
                </div>
                <span className="mr-1">{emoji}</span>
                <h3 className="flex-1 text-sm leading-tight font-semibold">
                  {sectionTitle(key as keyof typeof SECTION_TITLES)}
                </h3>
              </div>
              <textarea
                value={value}
                onChange={(e) => set(key, e.target.value)}
                placeholder="Escribe aquí tu reflexión..."
                rows={3}
                className={cn(
                  'bg-background w-full resize-none rounded-xl border p-3 text-sm transition-colors outline-none',
                  'placeholder:text-muted focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
                  filled ? 'border-[var(--color-success)]/40' : 'border-border',
                )}
              />
            </motion.div>
          );
        })}

        {/* Botón completar */}
        <AnimatePresence>
          {celebrated ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--color-success)] p-5 text-white"
            >
              <CheckCircle2 size={32} />
              <p className="text-base font-bold">¡Devocional completado!</p>
              <p className="text-sm opacity-80">Volviendo al inicio...</p>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleComplete}
              disabled={saving}
              className={cn(
                'rounded-2xl py-4 text-base font-bold text-white transition-colors',
                allFilled ? 'bg-[var(--color-success)]' : 'bg-border text-muted cursor-not-allowed',
                saving && 'opacity-70',
              )}
            >
              {saving
                ? 'Guardando...'
                : allFilled
                  ? '✓ Completar devocional'
                  : `Completar (${filledCount}/${sectionKeys.length})`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
