'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import type { ApiResponse } from '@/types/api';
import type { BibleSearchResult, BibleVersion } from '@/lib/bible-reader';

type Props = {
  version: BibleVersion;
};

export function BibleSearchClient({ version }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();

    const timer = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      fetch(`/api/bible/search?q=${encodeURIComponent(q)}&version=${version}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((json: ApiResponse<BibleSearchResult[]>) => {
          if (json.success) setResults(json.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, version]);

  function goToResult(result: BibleSearchResult) {
    router.push(`/biblia/${result.bookKey}/${result.chapterIndex}?v=${result.verseNumber}`);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="border-border bg-surface flex flex-1 items-center gap-2 rounded-full border px-3 py-2">
          <Search size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la Biblia..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        {query.trim().length >= 2 && loading && (
          <p className="text-muted text-center text-sm">Buscando…</p>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <p className="text-muted text-center text-sm">Sin resultados para &quot;{query}&quot;</p>
        )}

        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className="text-muted text-center text-sm">Escribe al menos 2 letras</p>
        )}

        <div className="flex flex-col gap-2">
          {results.map((result, i) => (
            <button
              key={`${result.bookKey}-${result.chapterIndex}-${result.verseNumber}-${i}`}
              type="button"
              onClick={() => goToResult(result)}
              className="border-border bg-surface rounded-2xl border p-4 text-left"
            >
              <p className="mb-1 text-xs font-bold text-[var(--color-primary)]">
                {result.bookName} {result.chapterIndex + 1}:{result.verseNumber}
              </p>
              <p className="text-sm leading-relaxed">{result.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
