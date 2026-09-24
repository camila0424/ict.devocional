'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import type { ApiResponse } from '@/types/api';
import type { BibleSearchResult, BibleVersion } from '@/lib/bible-reader';
import { contentStemsOf, normalizeBibleText, stem } from '@/lib/bible-search-text';

type Props = {
  version: BibleVersion;
};

// Resalta en el versículo las palabras que coinciden con la búsqueda.
function HighlightedText({ text, stems }: { text: string; stems: Set<string> }) {
  const parts = text.split(/([p{L}p{N}]+)/u);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 && stems.has(stem(normalizeBibleText(part))) ? (
          <span key={i} className="font-semibold text-[var(--color-primary)]">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function BibleSearchClient({ version }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Las raíces se calculan de la búsqueda que produjo los resultados, no de lo que se
  // está escribiendo, para que el resaltado no cambie antes de que lleguen resultados nuevos.
  const [resultsQuery, setResultsQuery] = useState('');
  const highlightStems = useMemo(() => new Set(contentStemsOf(resultsQuery)), [resultsQuery]);

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
          if (!json.success) return;
          setResults(json.data);
          setResultsQuery(q);
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
    const verses = result.verseEnd
      ? `${result.verseNumber}-${result.verseEnd}`
      : `${result.verseNumber}`;
    router.push(`/biblia/${result.bookKey}/${result.chapterIndex}?v=${verses}`);
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
            placeholder="Busca una palabra o pega un versículo..."
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
            <Fragment key={`${result.bookKey}-${result.chapterIndex}-${result.verseNumber}-${i}`}>
              {result.match === 'similar' && results[i - 1]?.match !== 'similar' && (
                <p className="text-muted mt-3 mb-1 px-1 text-xs font-bold tracking-wide uppercase">
                  Pasajes similares
                </p>
              )}
              <button
                type="button"
                onClick={() => goToResult(result)}
                className="border-border bg-surface rounded-2xl border p-4 text-left"
              >
                <p className="mb-1 text-xs font-bold text-[var(--color-primary)]">
                  {result.bookName} {result.chapterIndex + 1}:{result.verseNumber}
                  {result.verseEnd ? `-${result.verseEnd}` : ''}
                </p>
                <p className="text-sm leading-relaxed">
                  <HighlightedText text={result.text} stems={highlightStems} />
                </p>
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
