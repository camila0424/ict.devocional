import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DictionaryClient } from '@/components/dictionary/DictionaryClient';

export default async function DiccionarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { q } = await searchParams;
  return <DictionaryClient initialQuery={q?.slice(0, 60) ?? ''} />;
}
