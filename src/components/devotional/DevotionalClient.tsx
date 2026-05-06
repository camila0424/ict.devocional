'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { fetchBibleText } from '@/lib/bible-api';
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

type ReadingItemState = 'idle' | 'loading' | 'open' | 'error';

function ReadingItem({ reading }: { reading: Reading }) {
  const [status, setStatus] = useState<ReadingItemState>('idle');
  const [text, setText] = useState<string | null>(null);

  async function toggle() {
    if (status === 'loading') return;
    if (status === 'open') {
      setStatus('idle');
      return;
    }
    if (text !== null) {
      setStatus('open');
      return;
    }
    setStatus('loading');
    try {
      const result = await fetchBibleText(reading.bookFull, reading.reference);
      setText(result.text);
      setStatus('open');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-primary-light)] px-3 py-2.5 text-left transition-opacity active:opacity-70"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
          {reading.order}
        </span>
        <span className="flex-1 font-semibold text-[var(--color-primary-dark)]">
          {reading.bookFull} {reading.reference}
        </span>
        {status === 'loading' ? (
          <Loader2 size={14} className="text-muted shrink-0 animate-spin" />
        ) : status === 'open' ? (
          <ChevronUp size={14} className="text-muted shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {status === 'open' && text && (
          <motion.div
            key="text"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="text-foreground px-3 pt-3 pb-2 text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pt-2 pb-1 text-xs text-red-500"
          >
            No se pudo cargar el texto. Toca de nuevo para reintentar.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

type Props = { entry: EntryProps; initialResponse: ResponseState | null };

export function DevotionalClient({ entry, initialResponse }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<ResponseState>(initialResponse ?? EMPTY_RESPONSE);
  const [saving, setSaving] = useState(false);
  const [celebrated, setCelebrated] = useState(!!initialResponse?.completedAt);
  const [showBibleBanner, setShowBibleBanner] = useState(true);

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
        {/* Banner Biblia física */}
        {showBibleBanner && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/40">
            <p className="flex-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              📖 ¿Tienes tu Biblia física a mano? Te invitamos a leerla en lugar de la pantalla.
            </p>
            <button
              onClick={() => setShowBibleBanner(false)}
              aria-label="Cerrar"
              className="shrink-0 text-blue-400 transition-colors hover:text-blue-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Lecturas */}
        <div className="border-border bg-surface rounded-2xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--color-primary)]" />
            <h2 className="font-bold">Lecturas de hoy</h2>
          </div>
          <div className="flex flex-col gap-2">
            {entry.readings.map((r) => (
              <ReadingItem key={r.id} reading={r} />
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
