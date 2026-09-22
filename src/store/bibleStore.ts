import { create } from 'zustand';
import type { SavedVerse } from '@prisma/client';

export interface SavedVerseLocal {
  id: string;
  bookKey: string;
  chapter: number;
  verse: number;
  versionKey: string;
  savedAt: string;
}

interface BibleState {
  selectedVersion: 'RVR1960' | 'NTV';
  selectedBook: string | null;
  selectedChapter: number | null;
  selectedVerse: number | null;
  savedVerses: SavedVerse[];
  verseNotes: Map<string, string>;

  setVersion: (version: 'RVR1960' | 'NTV') => void;
  setSelectedBook: (bookKey: string | null) => void;
  setSelectedChapter: (index: number | null) => void;
  setSelectedVerse: (index: number | null) => void;
  setSavedVerses: (verses: SavedVerse[]) => void;
  addSavedVerse: (verse: SavedVerse) => void;
  removeSavedVerse: (id: string) => void;
  setVerseNote: (key: string, text: string) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  selectedVersion: 'RVR1960',
  selectedBook: null,
  selectedChapter: null,
  selectedVerse: null,
  savedVerses: [],
  verseNotes: new Map(),

  setVersion: (version) => set({ selectedVersion: version }),
  setSelectedBook: (bookKey) => set({ selectedBook: bookKey }),
  setSelectedChapter: (index) => set({ selectedChapter: index }),
  setSelectedVerse: (index) => set({ selectedVerse: index }),
  setSavedVerses: (verses) => set({ savedVerses: verses }),
  addSavedVerse: (verse) => set((state) => ({ savedVerses: [...state.savedVerses, verse] })),
  removeSavedVerse: (id) =>
    set((state) => ({
      savedVerses: state.savedVerses.filter((v) => v.id !== id),
    })),
  setVerseNote: (key, text) =>
    set((state) => {
      const verseNotes = new Map(state.verseNotes);
      verseNotes.set(key, text);
      return { verseNotes };
    }),
}));
