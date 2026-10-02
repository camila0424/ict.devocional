'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DICTIONARIES,
  loadDictionary,
  searchDictionary,
  type DictionaryEntry,
  type DictionaryId,
} from '@/lib/dictionary';

export type DictionarySource = 'all' | DictionaryId;

export const SOURCE_OPTIONS: { id: DictionarySource; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...DICTIONARIES.map((d) => ({ id: d.id, label: d.name })),
];

type Group = { id: DictionaryId; name: string; entries: DictionaryEntry[] };

function useDictionarySearch(query: string, source: DictionarySource) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = query.trim();
    // Con menos de 2 letras la interfaz muestra la ayuda y no mira los resultados anteriores
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      const wanted = DICTIONARIES.filter((d) => source === 'all' || d.id === source);
      try {
        const found = await Promise.all(
          wanted.map(async (d) => ({
            id: d.id,
            name: d.name,
            entries: searchDictionary(await loadDictionary(d.id), q),
          })),
        );
        if (cancelled) return;
        setGroups(found);
        setSearchedQuery(q);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, source]);

  return { groups, searchedQuery, loading, failed };
}

const COLLAPSED_LENGTH = 420;

function EntryCard({ entry }: { entry: DictionaryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.d.length > COLLAPSED_LENGTH;
  const text = expanded || !isLong ? entry.d : `${entry.d.slice(0, COLLAPSED_LENGTH).trimEnd()}…`;

  return (
    <article className="border-border bg-surface rounded-2xl border p-4">
      <h3 className="mb-1.5 text-base font-bold">{entry.t}</h3>
      <p className="text-sm leading-relaxed break-words whitespace-pre-line">{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          {expanded ? 'Ver menos' : 'Leer más'}
        </button>
      )}
    </article>
  );
}

export function DictionarySourceTabs({
  source,
  onChange,
}: {
  source: DictionarySource;
  onChange: (source: DictionarySource) => void;
}) {
  return (
    <div role="tablist" className="bg-border/50 flex gap-1 rounded-full p-1">
      {SOURCE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={source === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
            source === option.id
              ? 'bg-surface text-[var(--color-primary)] shadow-sm'
              : 'text-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function DictionaryResults({ query, source }: { query: string; source: DictionarySource }) {
  const { groups, searchedQuery, loading, failed } = useDictionarySearch(query, source);

  if (query.trim().length < 2) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Escribe una palabra para ver su significado, por ejemplo «gracia», «pacto» o «fe».
      </p>
    );
  }

  if (failed) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        No se pudo cargar el diccionario. Revisa tu conexión e inténtalo de nuevo.
      </p>
    );
  }

  if (loading && groups.length === 0) {
    return (
      <div className="text-muted flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 size={16} className="animate-spin" /> Buscando…
      </div>
    );
  }

  if (groups.every((g) => g.entries.length === 0)) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        No encontramos «{searchedQuery}» en{' '}
        {source === 'all' ? 'los diccionarios' : 'este diccionario'}.
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-5 transition-opacity', loading && 'opacity-60')}>
      {groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          {source === 'all' && (
            <h2 className="text-muted px-1 text-xs font-bold tracking-wide uppercase">
              {group.name}
            </h2>
          )}
          {group.entries.length === 0
            ? source === 'all' && <p className="text-muted px-1 text-sm">Sin resultados.</p>
            : group.entries.map((entry, i) => <EntryCard key={`${entry.t}-${i}`} entry={entry} />)}
        </section>
      ))}
    </div>
  );
}
