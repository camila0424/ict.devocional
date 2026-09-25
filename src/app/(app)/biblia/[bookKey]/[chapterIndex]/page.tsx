import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBibleBooks, getChapter, getChapterCount, type BibleVersion } from '@/lib/bible-reader';
import { parseVerseParam } from '@/lib/bible-verse-range';
import { ChapterReaderClient } from '@/components/bible/ChapterReaderClient';
import type { VerseNoteEntry } from '@/components/bible/VerseNotesPanel';

export default async function BibleChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookKey: string; chapterIndex: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { bookKey, chapterIndex: chapterIndexParam } = await params;
  const chapterIndex = Number(chapterIndexParam);
  if (!Number.isInteger(chapterIndex) || chapterIndex < 0) notFound();

  const book = getBibleBooks().find((b) => b.key === bookKey);
  if (!book) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bibleVersion: true },
  });
  const bibleVersion = (user?.bibleVersion ?? 'RVR1960') as BibleVersion;

  const chapterCount = getChapterCount(bookKey, bibleVersion);
  if (chapterIndex >= chapterCount) notFound();

  const verses = getChapter(bookKey, chapterIndex, bibleVersion);
  const chapter = chapterIndex + 1;

  const { v } = await searchParams;
  const initialVerses = parseVerseParam(v).filter((n) => n >= 1 && n <= verses.length);

  const [savedVerses, notes] = await Promise.all([
    prisma.savedVerse.findMany({
      where: { userId: session.user.id, bookKey, chapter, versionKey: bibleVersion },
      select: { id: true, verse: true },
    }),
    // Las notas del devocional se ven en cualquier versión, aunque se escribieran sobre RVR1960
    prisma.verseNote.findMany({
      where: {
        userId: session.user.id,
        bookKey,
        chapter,
        OR: [{ versionKey: bibleVersion }, { source: 'devotional' }],
      },
      select: { id: true, verse: true, noteText: true, color: true, source: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const savedMap = Object.fromEntries(savedVerses.map((v) => [v.verse, v.id]));
  const notesMap: Record<number, VerseNoteEntry[]> = {};
  for (const note of notes) {
    (notesMap[note.verse] ??= []).push({
      id: note.id,
      noteText: note.noteText,
      color: note.color,
      source: note.source,
    });
  }

  return (
    <ChapterReaderClient
      bookKey={bookKey}
      bookName={book.nameEs}
      chapterIndex={chapterIndex}
      chapterCount={chapterCount}
      verses={verses}
      version={bibleVersion}
      savedMap={savedMap}
      notesMap={notesMap}
      initialVerses={initialVerses}
    />
  );
}
