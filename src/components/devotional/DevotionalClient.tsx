'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fetchBibleReading } from '@/services/bibleService';

import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';
import { YoutubePlayer } from '@/components/devotional/YoutubePlayer';

type Reading = { id: string; order: number; bookAbbr: string; bookFull: string; reference: string };

type EntryProps = {
  id: string;
  dayNumber: number;
  date: string;
  readings: Reading[];
  youtubeVideoId?: string | null;
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

type ReadingItemUIState = 'idle' | 'loading' | 'open' | 'error';

function ReadingItem({
  reading,
  checked,
  onCheck,
}: {
  reading: Reading;
  checked: boolean;
  onCheck: () => void;
}) {
  const [status, setStatus] = useState<ReadingItemUIState>('idle');
  const [text, setText] = useState<string | null>(null);

  async function toggle() {
    if (status === 'loading') return;
    if (status === 'open') {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    try {
      const data = await fetchBibleReading(`${reading.bookAbbr} ${reading.reference}`);
      const formatted = data.chapters
        .flatMap((ch) => ch.verses)
        .map((v) => `${v.number} ${v.text}`)
        .join('\n');
      setText(formatted);
      setStatus('open');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className={cn('rounded-xl transition-colors', checked && 'bg-green-50 dark:bg-green-950/30')}
    >
      <div className="flex items-center gap-2 px-1 py-1.5">
        {/* iOS-style circular checkbox */}
        <button
          type="button"
          onClick={onCheck}
          aria-label="Marcar como leída"
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            checked
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-transparent',
          )}
        >
          {checked && (
            <svg
              viewBox="0 0 12 10"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="1,5 4,9 11,1" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-opacity active:opacity-70',
            checked ? 'bg-green-100/80 dark:bg-green-900/20' : 'bg-primary-light',
          )}
        >
          <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            {reading.order}
          </span>
          <span
            className={cn(
              'text-primary-dark flex-1 font-semibold',
              checked && 'line-through opacity-50',
            )}
          >
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
      </div>

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
            <p className="text-foreground px-4 pt-2 pb-2 text-sm leading-relaxed whitespace-pre-wrap">
              {text.split(/(\d+\s)/).map((part, i) =>
                /^\d+\s$/.test(part) ? (
                  <span key={i} className="text-foreground/80 font-bold dark:text-white">
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </p>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-2 pb-1 text-xs text-red-500"
          >
            No se pudo cargar el texto. Toca de nuevo para reintentar.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

type Props = {
  entry: EntryProps;
  initialResponse: ResponseState | null;
  initialStreak: number;
};

export function DevotionalClient({ entry, initialResponse, initialStreak }: Props) {
  const router = useRouter();
  const alreadyCompleted = !!initialResponse?.completedAt;

  const [responses, setResponses] = useState<ResponseState>(initialResponse ?? EMPTY_RESPONSE);
  const [readingChecks, setReadingChecks] = useState<boolean[]>(() =>
    entry.readings.map(() => alreadyCompleted),
  );
  const [videoWatched, setVideoWatched] = useState(alreadyCompleted);
  const [celebrated, setCelebrated] = useState(alreadyCompleted);
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(initialStreak);
  const [showBibleBanner, setShowBibleBanner] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const completingRef = useRef(alreadyCompleted);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const responsesRef = useRef(responses);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedValuesRef = useRef<ResponseState>(initialResponse ?? EMPTY_RESPONSE);
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  const saveFields = useCallback(
    (vals: ResponseState) => {
      const payload = Object.fromEntries(SECTIONS.map(({ key }) => [key, vals[key]]));
      setSaveStatus('saving');
      fetch('/api/devotional/save-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEntryId: entry.id, ...payload }),
      })
        .then((r) => {
          if (r.ok) {
            savedValuesRef.current = vals;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        })
        .catch(() => setSaveStatus('idle'));
    },
    [entry.id],
  );

  // Debounced auto-save whenever response fields change
  useEffect(() => {
    const changed = SECTIONS.some(({ key }) => responses[key] !== savedValuesRef.current[key]);
    if (!changed) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFields(responses), 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [responses, saveFields]);

  const total = entry.readings.length;
  const checkedReadings = readingChecks.filter(Boolean).length;
  const progress = checkedReadings;

  useEffect(() => {
    if (progress === total && !celebrated && !completingRef.current) {
      completingRef.current = true;
      setCelebrated(true);
      setShowCelebration(true);
      const sectionValues = Object.fromEntries(
        SECTIONS.map(({ key }) => [key, responsesRef.current[key]]),
      );
      fetch('/api/devotional/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEntryId: entry.id, ...sectionValues }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.data?.streak) setStreak(data.data.streak);
          window.dispatchEvent(new Event('devotional-completed'));
        })
        .catch(() => {});
    }
  }, [progress, total, celebrated, entry.id]);

  function toggleReading(idx: number) {
    setReadingChecks((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }

  function set(key: keyof Omit<ResponseState, 'completedAt'>, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  const sectionKeys = SECTIONS.map((s) => s.key);
  const filledCount = sectionKeys.filter((k) => responses[k].trim().length > 0).length;

  return (
    <div className="flex flex-col">
      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-gray-900"
            >
              <div className="mb-4 text-6xl">🎉</div>
              <h2 className="mb-2 text-xl font-bold">¡Completaste tu devocional de hoy!</h2>
              <p className="text-muted mb-6 text-sm leading-relaxed">
                Tu racha sigue creciendo 🔥 Ahora te invitamos a llenar tu Orden del Día para
                profundizar más.
              </p>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  setTimeout(() => {
                    sectionsRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="bg-primary mb-3 w-full rounded-2xl py-3.5 text-sm font-bold text-white"
              >
                Llenar mi Orden del Día →
              </button>
              <button
                onClick={() => router.push('/')}
                className="border-border text-muted w-full rounded-2xl border py-3.5 text-sm font-semibold"
              >
                Listo, gracias
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-border bg-primary sticky top-0 z-10 border-b px-4 py-4">
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
            {progress}/{total}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: `${(progress / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <AnimatePresence>
          {saveStatus !== 'idle' && (
            <motion.p
              key={saveStatus}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-right text-xs text-blue-200"
            >
              {saveStatus === 'saving' ? 'Guardando…' : '✓ Guardado'}
            </motion.p>
          )}
        </AnimatePresence>
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
            <BookOpen size={16} className="text-primary" />
            <h2 className="font-bold">Lecturas de hoy</h2>
            <span className="text-muted ml-auto text-xs">
              {checkedReadings}/{entry.readings.length} leídas
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {entry.readings.map((r, idx) => (
              <ReadingItem
                key={r.id}
                reading={r}
                checked={readingChecks[idx] ?? false}
                onCheck={() => toggleReading(idx)}
              />
            ))}
          </div>
        </div>

        {/* Video devocional */}
        <YoutubePlayer
          dayNumber={entry.dayNumber}
          month={parseInt(entry.date.split('-')[1]!, 10)}
          watched={videoWatched}
          onWatched={() => setVideoWatched(true)}
        />

        {/* Banner completado */}
        {celebrated && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/40">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Devocional completado hoy · Racha: {streak} días 🔥
            </p>
          </div>
        )}

        {/* 8 Secciones */}
        <div ref={sectionsRef} className="flex flex-col gap-4">
          {!celebrated && (
            <p className="text-muted text-center text-xs">
              Opcional: llena las siguientes secciones para profundizar más.
            </p>
          )}
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
                  filled ? 'bg-surface border-success' : 'border-border bg-surface',
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors',
                      filled ? 'bg-success text-white' : 'border-border text-muted border',
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
                    'placeholder:text-muted focus:border-primary focus:ring-primary-light focus:ring-2',
                    filled ? 'border-success/40' : 'border-border',
                  )}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Secciones completadas hint */}
        {celebrated && filledCount > 0 && filledCount < sectionKeys.length && (
          <p className="text-muted text-center text-xs">
            {sectionKeys.length - filledCount} secciones sin llenar — puedes completarlas cuando
            quieras.
          </p>
        )}
      </div>
    </div>
  );
}
