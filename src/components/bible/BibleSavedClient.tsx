'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import { NoteCard, type VerseNoteEntry } from '@/components/bible/VerseNotesPanel';

export type SavedEntry = {
  key: string;
  bookKey: string;
  bookName: string;
  chapter: number;
  verse: number;
  versionKey: string;
  text: string;
  savedId: string | null;
  notes: VerseNoteEntry[];
  latestActivity: number;
};

type Props = {
  entries: SavedEntry[];
};

export function BibleSavedClient({ entries: initialEntries }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [busyId, setBusyId] = useState<string | null>(null);

  function goToVerse(entry: SavedEntry) {
    router.push(`/biblia/${entry.bookKey}/${entry.chapter - 1}?v=${entry.verse}`);
  }

  async function unsave(entry: SavedEntry, e: React.MouseEvent) {
    e.stopPropagation();
    if (!entry.savedId) return;
    setBusyId(entry.key);
    try {
      const res = await fetch(`/api/bible/saved/${entry.savedId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEntries((prev) =>
        prev
          .map((en) => (en.key === entry.key ? { ...en, savedId: null } : en))
          .filter((en) => en.savedId !== null || en.notes.length > 0),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNote(entry: SavedEntry, noteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyId(noteId);
    try {
      const res = await fetch(`/api/bible/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEntries((prev) =>
        prev
          .map((en) =>
            en.key === entry.key ? { ...en, notes: en.notes.filter((n) => n.id !== noteId) } : en,
          )
          .filter((en) => en.savedId !== null || en.notes.length > 0),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold">Guardados y notas</h1>
      </div>

      <div className="flex-1 px-5 py-4">
        {entries.length === 0 ? (
          <p className="text-muted mt-8 text-center text-sm">
            Aún no has guardado versículos ni agregado notas.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div
                key={entry.key}
                role="button"
                tabIndex={0}
                onClick={() => goToVerse(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToVerse(entry);
                  }
                }}
                className="border-border bg-surface flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">
                    {entry.bookName} {entry.chapter}:{entry.verse}{' '}
                    <span className="text-muted font-normal">({entry.versionKey})</span>
                  </p>
                  {entry.savedId && (
                    <button
                      type="button"
                      onClick={(e) => unsave(entry, e)}
                      disabled={busyId === entry.key}
                      aria-label="Quitar de guardados"
                      className="shrink-0 disabled:opacity-40"
                    >
                      <Heart
                        size={18}
                        className="fill-[var(--color-primary)] text-[var(--color-primary)]"
                      />
                    </button>
                  )}
                </div>

                {entry.text && <p className="text-sm leading-relaxed">{entry.text}</p>}

                {entry.notes.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {entry.notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onDelete={(e) => deleteNote(entry, note.id, e)}
                        deleting={busyId === note.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
