'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASTEL_COLORS } from '@/lib/note-colors';
import { DEVOTIONAL_NOTE_TITLE } from '@/lib/note-source';

export type VerseNoteEntry = { id: string; noteText: string; color: string; source: string };

export function NoteCard({
  note,
  onDelete,
  deleting,
}: {
  note: VerseNoteEntry;
  onDelete: (e: React.MouseEvent) => void;
  deleting: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-2 rounded-xl p-3"
      style={{ backgroundColor: note.color }}
    >
      <div className="min-w-0">
        {note.source === 'devotional' && (
          <p className="mb-0.5 text-[11px] font-bold tracking-wide text-black/60 uppercase">
            {DEVOTIONAL_NOTE_TITLE}
          </p>
        )}
        <p className="text-sm break-words text-black">{note.noteText}</p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Borrar nota"
        className="shrink-0 text-black/50 hover:text-black/80 disabled:opacity-40"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

type Props = {
  notes: VerseNoteEntry[];
  onSave: (noteText: string, color: string) => Promise<boolean>;
  onDelete: (noteId: string) => Promise<void>;
};

// Lista de notas de un versículo + editor para agregar una nueva
export function VerseNotesPanel({ notes, onSave, onDelete }: Props) {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState<string>(PASTEL_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startNewNote() {
    setDraft('');
    setColor(PASTEL_COLORS[0]);
    setMode('edit');
  }

  async function save() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    const ok = await onSave(text, color);
    setSaving(false);
    if (ok) setMode('list');
  }

  async function remove(noteId: string) {
    setDeletingId(noteId);
    await onDelete(noteId);
    setDeletingId(null);
  }

  if (mode === 'edit') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2">
          {PASTEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label="Elegir color"
              onClick={() => setColor(c)}
              className={cn(
                'h-7 w-7 rounded-full border-2',
                color === c ? 'border-black/60' : 'border-black/10',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe tu nota..."
          rows={5}
          autoFocus
          className="bg-background border-border placeholder:text-muted focus:border-primary focus:ring-primary-light w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="border-border flex-1 rounded-2xl border py-3 text-sm font-semibold"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !draft.trim()}
            className="bg-primary flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 ? (
        <p className="text-muted text-center text-sm">Aún no hay notas en este versículo</p>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => remove(note.id)}
              deleting={deletingId === note.id}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={startNewNote}
        className="border-border flex items-center justify-center gap-1.5 rounded-2xl border border-dashed py-3 text-sm font-semibold"
      >
        <Plus size={16} />
        Agregar nota
      </button>
    </div>
  );
}
