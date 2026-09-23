'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VersionSwitcher } from '@/components/bible/VersionSwitcher';
import type { BibleBook, BibleVersion } from '@/lib/bible-reader';

type BookWithChapters = BibleBook & { chapterCount: number };

type Props = {
  bibleVersion: BibleVersion;
  books: BookWithChapters[];
};

function BookList({
  books,
  expandedKey,
  onToggle,
  onGoToChapter,
}: {
  books: BookWithChapters[];
  expandedKey: string | null;
  onToggle: (key: string) => void;
  onGoToChapter: (bookKey: string, chapterIndex: number) => void;
}) {
  return (
    <ul className="divide-y divide-(--color-border)">
      {books.map((book) => {
        const isOpen = expandedKey === book.key;
        const chapters = Array.from({ length: book.chapterCount }, (_, i) => i);

        return (
          <li key={book.key}>
            <button
              type="button"
              onClick={() => onToggle(book.key)}
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
                        onClick={() => onGoToChapter(book.key, chapterIndex)}
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
  );
}

export function BibleHomeClient({ bibleVersion, books }: Props) {
  const router = useRouter();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  function toggleBook(key: string) {
    setExpandedKey((current) => (current === key ? null : key));
  }

  function goToChapter(bookKey: string, chapterIndex: number) {
    router.push(`/biblia/${bookKey}/${chapterIndex}`);
  }

  const { oldTestament, newTestament } = useMemo(() => {
    const splitIndex = books.findIndex((b) => b.key === 'matthew');
    const ntStart = splitIndex === -1 ? books.length : splitIndex;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? books.filter((b) => b.nameEs.toLowerCase().includes(normalized))
      : books;

    return {
      oldTestament: filtered.filter((b) => books.indexOf(b) < ntStart),
      newTestament: filtered.filter((b) => books.indexOf(b) >= ntStart),
    };
  }, [books, query]);

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
        className="border-border bg-surface flex items-center gap-2 rounded-full border px-3 py-2.5"
      >
        <Search size={16} className="text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar libro..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </motion.div>

      {oldTestament.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Antiguo Testamento
          </h2>
          <div className="bg-surface border-border overflow-hidden rounded-2xl border">
            <BookList
              books={oldTestament}
              expandedKey={expandedKey}
              onToggle={toggleBook}
              onGoToChapter={goToChapter}
            />
          </div>
        </motion.div>
      )}

      {oldTestament.length > 0 && newTestament.length > 0 && (
        <div className="border-border border-t" />
      )}

      {newTestament.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Nuevo Testamento
          </h2>
          <div className="bg-surface border-border overflow-hidden rounded-2xl border">
            <BookList
              books={newTestament}
              expandedKey={expandedKey}
              onToggle={toggleBook}
              onGoToChapter={goToChapter}
            />
          </div>
        </motion.div>
      )}

      {oldTestament.length === 0 && newTestament.length === 0 && (
        <p className="text-muted mt-4 text-center text-sm">
          No encontramos ningún libro para &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}
