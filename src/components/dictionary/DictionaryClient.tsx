'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  DictionaryResults,
  DictionarySourceTabs,
  type DictionarySource,
} from '@/components/dictionary/DictionaryResults';

export function DictionaryClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState<DictionarySource>('all');

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold">Diccionario bíblico</h1>
        <p className="text-muted mt-0.5 text-sm">
          Busca una palabra y compara sus significados en cada diccionario.
        </p>
      </div>

      <div className="border-border bg-surface flex items-center gap-2 rounded-2xl border px-3">
        <Search size={18} className="text-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar una palabra…"
          aria-label="Buscar en el diccionario"
          autoCapitalize="none"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Borrar búsqueda"
            className="text-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <DictionarySourceTabs source={source} onChange={setSource} />

      <DictionaryResults query={query} source={source} />
    </div>
  );
}
