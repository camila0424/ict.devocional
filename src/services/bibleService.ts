import { parseReference, type BibleReading } from '@/lib/bible-books';

const cache = new Map<string, BibleReading>();

export async function fetchBibleReading(ref: string): Promise<BibleReading> {
  if (cache.has(ref)) return cache.get(ref)!;
  const { bookKey, bookName, chapters } = parseReference(ref);
  const data: BibleReading = { reference: ref, bookKey, bookName, chapters };
  cache.set(ref, data);
  return data;
}

export async function fetchDayReadings(
  refs: [string, string, string],
): Promise<Array<BibleReading | null>> {
  const results = await Promise.allSettled(refs.map(fetchBibleReading));
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}
