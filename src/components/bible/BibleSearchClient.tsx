'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import type { BibleVersion } from '@/lib/bible-reader';
import { BibleVerseResults, useBibleVerseSearch } from '@/components/bible/BibleVerseSearch';

type Props = {
  version: BibleVersion;
};

export function BibleSearchClient({ version }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { results, resultsQuery, loading } = useBibleVerseSearch(query, version);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

        <BibleVerseResults results={results} resultsQuery={resultsQuery} />
      </div>
    </div>
  );
}
