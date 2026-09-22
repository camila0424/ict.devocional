'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VersionSwitcher } from '@/components/bible/VersionSwitcher';
import type { BibleBook, BibleVersion } from '@/lib/bible-reader';

type BookWithChapters = BibleBook & { chapterCount: number };

type Props = {
  bibleVersion: BibleVersion;
  books: BookWithChapters[];
};

export function BibleHomeClient({ bibleVersion, books }: Props) {
  const router = useRouter();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  function toggleBook(key: string) {
    setExpandedKey((current) => (current === key ? null : key));
  }

  function goToChapter(bookKey: string, chapterIndex: number) {
    router.push(`/biblia/${bookKey}/${chapterIndex}`);
  }

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-extrabold">Biblia</h1>
        <VersionSwitcher version={bibleVersion} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">Recientes</h2>
        <div className="border-border bg-surface flex items-center justify-center rounded-2xl border border-dashed p-6">
          <p className="text-muted text-sm">Aún no has leído ningún capítulo</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="bg-surface border-border overflow-hidden rounded-2xl border"
      >
        <ul className="divide-y divide-(--color-border)">
          {books.map((book) => {
            const isOpen = expandedKey === book.key;
            const chapters = Array.from({ length: book.chapterCount }, (_, i) => i);

            return (
              <li key={book.key}>
                <button
                  type="button"
                  onClick={() => toggleBook(book.key)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="font-medium">{book.nameEs}</span>
                  <ChevronDown
                    size={18}
                    className={cn('text-muted transition-transform', isOpen && 'rotate-180')}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-6 gap-2 px-4 pb-4 sm:grid-cols-8">
                        {chapters.map((chapterIndex) => (
                          <button
                            key={chapterIndex}
                            type="button"
                            onClick={() => goToChapter(book.key, chapterIndex)}
                            className="bg-background aspect-square rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--color-primary-light)] dark:hover:bg-[var(--color-primary-dark)]/40"
                          >
                            {chapterIndex + 1}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
