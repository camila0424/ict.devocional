'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ExternalLink, X } from 'lucide-react';
import {
  DictionaryResults,
  DictionarySourceTabs,
  type DictionarySource,
} from '@/components/dictionary/DictionaryResults';

// Hoja inferior con el significado de la palabra que la persona seleccionó leyendo la Biblia.
export function DictionarySheet({ word, onClose }: { word: string; onClose: () => void }) {
  const [source, setSource] = useState<DictionarySource>('all');

  return (
    <>
      <motion.div
        key="dictionary-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/40"
      />
      <motion.div
        key="dictionary-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-surface fixed inset-x-0 bottom-0 z-[90] mx-auto flex max-h-[80dvh] max-w-170 flex-col rounded-t-3xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-base font-bold">Diccionario · «{word}»</h2>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/diccionario?q=${encodeURIComponent(word)}`}
              aria-label="Abrir en el diccionario"
              className="text-muted flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ExternalLink size={16} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-muted flex h-8 w-8 items-center justify-center rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mb-3 shrink-0">
          <DictionarySourceTabs source={source} onChange={setSource} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <DictionaryResults query={word} source={source} />
        </div>
      </motion.div>
    </>
  );
}
