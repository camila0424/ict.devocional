import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBibleBooks, getChapter, type BibleVersion } from '@/lib/bible-reader';
import { BibleSavedClient, type SavedEntry } from '@/components/bible/BibleSavedClient';

export default async function BibleSavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  const [savedVerses, notes] = await Promise.all([
    prisma.savedVerse.findMany({ where: { userId } }),
    prisma.verseNote.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ]);

  const bookNames = Object.fromEntries(getBibleBooks().map((b) => [b.key, b.nameEs]));

  const entries = new Map<string, SavedEntry>();

  function keyFor(bookKey: string, chapter: number, verse: number, versionKey: string) {
    return `${bookKey}-${chapter}-${verse}-${versionKey}`;
  }

  function getVerseText(bookKey: string, chapter: number, verse: number, versionKey: string) {
    try {
      const verses = getChapter(bookKey, chapter - 1, versionKey as BibleVersion);
      return verses[verse - 1] ?? '';
    } catch {
      return '';
    }
  }

  for (const sv of savedVerses) {
    const key = keyFor(sv.bookKey, sv.chapter, sv.verse, sv.versionKey);
    entries.set(key, {
      key,
      bookKey: sv.bookKey,
      bookName: bookNames[sv.bookKey] ?? sv.bookKey,
      chapter: sv.chapter,
      verse: sv.verse,
      versionKey: sv.versionKey,
      text: getVerseText(sv.bookKey, sv.chapter, sv.verse, sv.versionKey),
      savedId: sv.id,
      notes: [],
      latestActivity: sv.savedAt.getTime(),
    });
  }

  for (const note of notes) {
    const key = keyFor(note.bookKey, note.chapter, note.verse, note.versionKey);
    const existing = entries.get(key);
    const noteEntry = { id: note.id, noteText: note.noteText, color: note.color };
    if (existing) {
      existing.notes.push(noteEntry);
      existing.latestActivity = Math.max(existing.latestActivity, note.createdAt.getTime());
    } else {
      entries.set(key, {
        key,
        bookKey: note.bookKey,
        bookName: bookNames[note.bookKey] ?? note.bookKey,
        chapter: note.chapter,
        verse: note.verse,
        versionKey: note.versionKey,
        text: getVerseText(note.bookKey, note.chapter, note.verse, note.versionKey),
        savedId: null,
        notes: [noteEntry],
        latestActivity: note.createdAt.getTime(),
      });
    }
  }

  const sorted = Array.from(entries.values()).sort((a, b) => b.latestActivity - a.latestActivity);

  return <BibleSavedClient entries={sorted} />;
}
