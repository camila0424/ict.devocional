'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Share2,
  Heart,
  NotebookPen,
  Copy,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatVerseParam } from '@/lib/bible-verse-range';
import { VersionSwitcher } from '@/components/bible/VersionSwitcher';
import { VerseNotesPanel, type VerseNoteEntry } from '@/components/bible/VerseNotesPanel';
import type { BibleVersion } from '@/lib/bible-reader';
import type { ApiResponse } from '@/types/api';
import type { SavedVerse, VerseNote } from '@prisma/client';

type Props = {
  bookKey: string;
  bookName: string;
  chapterIndex: number;
  chapterCount: number;
  verses: string[];
  version: BibleVersion;
  savedMap: Record<number, string>;
  notesMap: Record<number, VerseNoteEntry[]>;
  initialVerses: number[];
};

export function ChapterReaderClient({
  bookKey,
  bookName,
  chapterIndex,
  chapterCount,
  verses,
  version,
  savedMap: initialSavedMap,
  notesMap: initialNotesMap,
  initialVerses,
}: Props) {
  const router = useRouter();
  const chapterTitle = `${bookName} ${chapterIndex + 1}`;

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialVerses);
  const [sheetView, setSheetView] = useState<'actions' | 'notes'>('actions');
  const [savedMap, setSavedMap] = useState(initialSavedMap);
  const [notesMap, setNotesMap] = useState(initialNotesMap);
  const [togglingSave, setTogglingSave] = useState(false);
  const didScrollToInitial = useRef(false);

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < chapterCount - 1;
  const sortedSelected = [...selectedNumbers].sort((a, b) => a - b);
  const hasSelection = sortedSelected.length > 0;
  const isSingleSelection = sortedSelected.length === 1;
  const selectionLabel = hasSelection ? formatVerseParam(sortedSelected) : '';
  const allSelectedSaved = hasSelection && sortedSelected.every((n) => !!savedMap[n]);
  const activeVerseNumber = isSingleSelection ? sortedSelected[0] : undefined;
  const activeVerseNotes =
    activeVerseNumber !== undefined ? (notesMap[activeVerseNumber] ?? []) : [];

  useEffect(() => {
    if (didScrollToInitial.current) return;
    if (initialVerses.length === 0) return;
    didScrollToInitial.current = true;
    const first = Math.min(...initialVerses);
    const el = document.getElementById(`verse-${first}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleVerse(verseNumber: number) {
    setSelectedNumbers((prev) =>
      prev.includes(verseNumber) ? prev.filter((n) => n !== verseNumber) : [...prev, verseNumber],
    );
    setSheetView('actions');
  }

  function openNotesFor(verseNumber: number) {
    setSelectedNumbers([verseNumber]);
    setSheetView('notes');
  }

  function closeSheet() {
    setSelectedNumbers([]);
    setSheetView('actions');
  }

  async function toggleSaved() {
    if (!hasSelection) return;
    const chapter = chapterIndex + 1;
    setTogglingSave(true);

    try {
      if (allSelectedSaved) {
        const ids = sortedSelected.map((n) => savedMap[n]).filter(Boolean) as string[];
        setSavedMap((prev) => {
          const next = { ...prev };
          for (const n of sortedSelected) delete next[n];
          return next;
        });
        await Promise.all(ids.map((id) => fetch(`/api/bible/saved/${id}`, { method: 'DELETE' })));
      } else {
        const toSave = sortedSelected.filter((n) => !savedMap[n]);
        const results = await Promise.all(
          toSave.map(async (verseNumber) => {
            const res = await fetch('/api/bible/saved', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookKey, chapter, verse: verseNumber, versionKey: version }),
            });
            const data = (await res.json()) as ApiResponse<SavedVerse>;
            if (!res.ok || !data.success) throw new Error();
            return { verseNumber, id: data.data.id };
          }),
        );
        setSavedMap((prev) => {
          const next = { ...prev };
          for (const { verseNumber, id } of results) next[verseNumber] = id;
          return next;
        });
      }
    } catch {
      toast.error('No se pudo actualizar el marcador');
    } finally {
      setTogglingSave(false);
    }
  }

  async function saveNote(noteText: string, color: string): Promise<boolean> {
    if (activeVerseNumber === undefined) return false;
    const chapter = chapterIndex + 1;
    try {
      const res = await fetch('/api/bible/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookKey,
          chapter,
          verse: activeVerseNumber,
          versionKey: version,
          noteText,
          color,
        }),
      });
      const data = (await res.json()) as ApiResponse<VerseNote>;
      if (!res.ok || !data.success) throw new Error();
      setNotesMap((prev) => {
        const next = { ...prev };
        const existing = next[activeVerseNumber] ?? [];
        next[activeVerseNumber] = [
          ...existing,
          {
            id: data.data.id,
            noteText: data.data.noteText,
            color: data.data.color,
            source: data.data.source,
          },
        ];
        return next;
      });
      toast.success('Nota guardada');
      return true;
    } catch {
      toast.error('No se pudo guardar la nota');
      return false;
    }
  }

  async function deleteNote(noteId: string) {
    if (activeVerseNumber === undefined) return;
    try {
      const res = await fetch(`/api/bible/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setNotesMap((prev) => {
        const next = { ...prev };
        next[activeVerseNumber] = (next[activeVerseNumber] ?? []).filter((n) => n.id !== noteId);
        return next;
      });
    } catch {
      toast.error('No se pudo borrar la nota');
    }
  }

  async function copyVerse() {
    if (!hasSelection) return;
    const chapter = chapterIndex + 1;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const link = `${appUrl}/biblia/${bookKey}/${chapterIndex}?v=${selectionLabel}`;

    const firstSelected = sortedSelected[0];
    const text =
      isSingleSelection && firstSelected !== undefined
        ? verses[firstSelected - 1]
        : sortedSelected.map((n) => `${n} ${verses[n - 1] ?? ''}`).join(' ');

    const message = `${text}\n— ${bookName} ${chapter}:${selectionLabel} (${version})\n\nLee más en: ${link}`;
    try {
      await navigator.clipboard.writeText(message);
      toast.success('¡Copiado!', { duration: 2000 });
    } catch {
      toast.error('No se pudo copiar');
    }
  }

  async function shareChapter() {
    const chapter = chapterIndex + 1;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const link = `${appUrl}/biblia/${bookKey}/${chapterIndex}`;
    const message = `${bookName} ${chapter} (${version})\n\nLee este capítulo en la app:\n${link}\n\nDescarga ICT Devocional:\nhttps://ict-devocional.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // usuario canceló el share, no hacer nada
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      toast.success('¡Copiado!', { duration: 2000 });
    } catch {
      toast.error('No se pudo compartir');
    }
  }

  function goToImage() {
    if (!hasSelection) return;
    router.push(
      `/biblia/imagen?book=${bookKey}&chapter=${chapterIndex}&verse=${selectionLabel}&version=${version}`,
    );
  }

  function goToChapter(nextIndex: number) {
    closeSheet();
    router.push(`/biblia/${bookKey}/${nextIndex}`);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.push('/biblia/buscar')}
            aria-label="Buscar"
            className="text-muted flex h-9 w-9 items-center justify-center rounded-full"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={shareChapter}
            aria-label="Compartir capítulo"
            className="text-muted flex h-9 w-9 items-center justify-center rounded-full"
          >
            <Share2 size={18} />
          </button>
          <VersionSwitcher version={version} />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-5 pt-4 pb-40 md:pb-24">
        <h1 className="mb-4 text-2xl font-extrabold">{chapterTitle}</h1>
        <div className="flex flex-col gap-1">
          {verses.map((text, idx) => {
            const verseNumber = idx + 1;
            const isSelected = selectedNumbers.includes(verseNumber);
            const verseNotes = notesMap[verseNumber] ?? [];
            const highlightColor = verseNotes[verseNotes.length - 1]?.color;

            return (
              <div
                key={idx}
                id={`verse-${verseNumber}`}
                role="button"
                tabIndex={0}
                onClick={() => toggleVerse(verseNumber)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleVerse(verseNumber);
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-start gap-1.5 rounded-lg px-2 py-1 text-left transition-colors',
                  isSelected &&
                    'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-dark)]/40',
                )}
                style={
                  !isSelected && highlightColor ? { backgroundColor: highlightColor } : undefined
                }
              >
                <span className="text-muted mt-0.5 text-xs font-semibold">{verseNumber}</span>
                <span className="flex-1 text-[18px] leading-loose">{text}</span>
                {verseNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openNotesFor(verseNumber);
                    }}
                    aria-label={`${verseNotes.length} nota(s) en este versículo`}
                    className="mt-2 flex shrink-0 items-center gap-0.5 rounded-full px-1 py-1"
                  >
                    {verseNotes.slice(0, 4).map((note) => (
                      <span
                        key={note.id}
                        className="h-2 w-2 rounded-full border border-black/10"
                        style={{ backgroundColor: note.color }}
                      />
                    ))}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navegación de capítulo */}
      <div className="border-border bg-background/95 fixed inset-x-0 bottom-20 z-30 flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-lg md:bottom-0">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => goToChapter(chapterIndex - 1)}
          aria-label="Capítulo anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => router.push('/biblia')}
          className="rounded-full px-3 py-1 text-sm font-semibold"
        >
          {chapterTitle}
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => goToChapter(chapterIndex + 1)}
          aria-label="Capítulo siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="bg-surface fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">
                {bookName} {chapterIndex + 1}:{selectionLabel}
              </h2>
              <button type="button" onClick={closeSheet} aria-label="Cerrar" className="text-muted">
                <X size={20} />
              </button>
            </div>

            {sheetView === 'actions' && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={toggleSaved}
                    disabled={togglingSave}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-3 disabled:opacity-50"
                  >
                    <Heart
                      size={22}
                      className={
                        allSelectedSaved
                          ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'text-muted'
                      }
                    />
                    <span className="text-xs font-medium">Guardar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => isSingleSelection && setSheetView('notes')}
                    disabled={!isSingleSelection}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-3 disabled:opacity-30"
                  >
                    <NotebookPen size={22} className="text-muted" />
                    <span className="text-xs font-medium">Nota</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyVerse}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-3"
                  >
                    <Copy size={22} className="text-muted" />
                    <span className="text-xs font-medium">Copiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToImage}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-3"
                  >
                    <ImageIcon size={22} className="text-muted" />
                    <span className="text-xs font-medium">Imagen</span>
                  </button>
                </div>
                {!isSingleSelection && (
                  <p className="text-muted mt-3 text-center text-xs">
                    Selecciona un solo versículo para agregar una nota
                  </p>
                )}
              </>
            )}

            {sheetView === 'notes' && (
              <VerseNotesPanel
                key={activeVerseNumber}
                notes={activeVerseNotes}
                onSave={saveNote}
                onDelete={deleteNote}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
