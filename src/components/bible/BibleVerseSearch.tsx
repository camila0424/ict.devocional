'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/types/api';
import type { BibleSearchResult, BibleVersion } from '@/lib/bible-reader';
import { contentStemsOf, normalizeBibleText, stem } from '@/lib/bible-search-text';

// Busca versículos (palabra o fragmento) con debounce. Devuelve también la búsqueda que
// produjo los resultados, para resaltar según ella y no según lo que se está escribiendo.
export function useBibleVerseSearch(query: string, version: BibleVersion) {
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [resultsQuery, setResultsQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();

    const timer = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setResultsQuery('');
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

  return { results, resultsQuery, loading };
}

// Resalta en el versículo las palabras que coinciden con la búsqueda.
function HighlightedText({ text, stems }: { text: string; stems: Set<string> }) {
  const parts = text.split(/([\p{L}\p{N}]+)/u);
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

export function BibleVerseResults({
  results,
  resultsQuery,
}: {
  results: BibleSearchResult[];
  resultsQuery: string;
}) {
  const router = useRouter();
  const highlightStems = useMemo(() => new Set(contentStemsOf(resultsQuery)), [resultsQuery]);

  function goToResult(result: BibleSearchResult) {
    const verses = result.verseEnd
      ? `${result.verseNumber}-${result.verseEnd}`
      : `${result.verseNumber}`;
    router.push(`/biblia/${result.bookKey}/${result.chapterIndex}?v=${verses}`);
  }

  return (
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
  );
}
