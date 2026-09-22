import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBibleBooks, getChapterCount, type BibleVersion } from '@/lib/bible-reader';
import { BibleHomeClient } from '@/components/bible/BibleHomeClient';

export default async function BibliaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bibleVersion: true },
  });
  const bibleVersion = (user?.bibleVersion ?? 'RVR1960') as BibleVersion;

  const books = getBibleBooks().map((book) => ({
    ...book,
    chapterCount: getChapterCount(book.key, bibleVersion),
  }));

  return <BibleHomeClient bibleVersion={bibleVersion} books={books} />;
}
