import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { BibleVersion } from '@/lib/bible-reader';
import { BibleSearchClient } from '@/components/bible/BibleSearchClient';

export default async function BibleSearchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bibleVersion: true },
  });
  const bibleVersion = (user?.bibleVersion ?? 'RVR1960') as BibleVersion;

  return <BibleSearchClient version={bibleVersion} />;
}
