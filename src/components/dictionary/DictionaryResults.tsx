'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DICTIONARIES,
  loadDictionary,
  searchDictionary,
  type DictionaryEntry,
  type DictionaryId,
} from '@/lib/dictionary';
import { extraWordCount, summarizeEntry } from '@/lib/dictionary-summary';

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
            entries: searchDictionary(await loadDictionary(d.id, q), q),
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

const INITIAL_VISIBLE = 5;

function EntryCard({ entry }: { entry: DictionaryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => summarizeEntry(entry), [entry]);
  const extraWords = useMemo(() => extraWordCount(entry), [entry]);
  const hasMore = entry.d.trim() !== summary.text.trim();

  return (
    <article className="border-border bg-surface rounded-2xl border p-4">
      <h3 className="mb-1.5 text-base font-bold">{entry.t}</h3>

      {summary.words.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm leading-snug">
          {summary.words.map(({ word, gloss }) => (
            <li key={word}>
              <span className="font-semibold text-[var(--color-primary)] italic">{word}</span>
              <span className="text-muted"> · </span>
              {gloss}
            </li>
          ))}
          {extraWords > 0 && !expanded && (
            <li className="text-muted">y {extraWords} más en la definición completa</li>
          )}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed break-words">{summary.text}</p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          {expanded ? 'Ocultar definición completa' : 'Ver definición completa'}
        </button>
      )}

      {expanded && (
        <p className="border-border mt-3 border-t pt-3 text-sm leading-relaxed break-words whitespace-pre-line">
          {entry.d}
        </p>
      )}
    </article>
  );
}

function ResultGroup({
  name,
  entries,
  showName,
}: {
  name: string;
  entries: DictionaryEntry[];
  showName: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? entries : entries.slice(0, INITIAL_VISIBLE);

  return (
    <section className="flex flex-col gap-2">
      {showName && (
        <h2 className="text-muted px-1 text-xs font-bold tracking-wide uppercase">{name}</h2>
      )}
      {entries.length === 0
        ? showName && <p className="text-muted px-1 text-sm">Sin resultados.</p>
        : visible.map((entry, i) => <EntryCard key={`${entry.t}-${i}`} entry={entry} />)}
      {entries.length > INITIAL_VISIBLE && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm font-semibold text-[var(--color-primary)]"
        >
          Ver los {entries.length - INITIAL_VISIBLE} resultados restantes
        </button>
      )}
    </section>
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
        <ResultGroup
          key={group.id}
          name={group.name}
          entries={group.entries}
          showName={source === 'all'}
        />
      ))}
    </div>
  );
}
