import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getBibleBooks, getChapter, type BibleVersion } from '@/lib/bible-reader';
import { parseVerseParam, formatVerseParam } from '@/lib/bible-verse-range';
import { VerseImageClient } from '@/components/bible/VerseImageClient';

const VALID_VERSIONS: BibleVersion[] = ['RVR1960', 'NTV'];

export default async function VerseImagePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string; verse?: string; version?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const {
    book: bookKey,
    chapter: chapterParam,
    verse: verseParam,
    version: versionParam,
  } = await searchParams;

  const chapterIndex = Number(chapterParam);
  const verseNumbers = parseVerseParam(verseParam);

  if (
    !bookKey ||
    !Number.isInteger(chapterIndex) ||
    chapterIndex < 0 ||
    verseNumbers.length === 0 ||
    !versionParam ||
    !VALID_VERSIONS.includes(versionParam as BibleVersion)
  ) {
    notFound();
  }

  const version = versionParam as BibleVersion;

  const book = getBibleBooks().find((b) => b.key === bookKey);
  if (!book) notFound();

  const chapterVerses = getChapter(bookKey, chapterIndex, version);
  const selected = verseNumbers
    .filter((n) => n >= 1 && n <= chapterVerses.length)
    .map((n) => ({ number: n, text: chapterVerses[n - 1] ?? '' }));
  if (selected.length === 0) notFound();

  return (
    <VerseImageClient
      bookName={book.nameEs}
      chapter={chapterIndex + 1}
      verseLabel={formatVerseParam(selected.map((v) => v.number))}
      version={version}
      verses={selected}
    />
  );
}
