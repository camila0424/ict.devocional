'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Check, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BibleVersion } from '@/lib/bible-reader';

type VersionOption = {
  key: BibleVersion;
  name: string;
  description: string;
};

const VERSION_OPTIONS: VersionOption[] = [
  {
    key: 'RVR1960',
    name: 'Reina Valera 1960',
    description: 'Traducción clásica en español, lenguaje tradicional',
  },
  {
    key: 'NTV',
    name: 'Nueva Traducción Viviente',
    description: 'Lenguaje contemporáneo, fácil de entender',
  },
];

type Props = {
  version: BibleVersion;
  className?: string;
};

export function VersionSwitcher({ version, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function selectVersion(next: BibleVersion) {
    if (next === version) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/bible/version', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: next }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('No se pudo actualizar la versión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'border-border bg-surface flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
          className,
        )}
      >
        <Globe size={14} className="text-[var(--color-primary)]" />
        {version}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setOpen(false)}
              className="fixed inset-0 z-[80] bg-black/50"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-surface fixed inset-x-0 bottom-0 z-[90] rounded-t-3xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold">Versión de la Biblia</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {VERSION_OPTIONS.map((option) => {
                  const isActive = version === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={saving}
                      onClick={() => selectVersion(option.key)}
                      className={cn(
                        'border-border bg-background flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-50',
                        isActive && 'border-primary',
                      )}
                    >
                      <div>
                        <p className="text-xs font-semibold tracking-wide uppercase">
                          {option.key}
                        </p>
                        <p className="mt-0.5 font-bold">{option.name}</p>
                        <p className="text-muted mt-1 text-sm">{option.description}</p>
                      </div>
                      <div
                        className={cn(
                          'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                          isActive ? 'bg-primary border-primary' : 'border-border',
                        )}
                      >
                        {isActive && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
