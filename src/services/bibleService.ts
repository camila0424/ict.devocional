import type { BibleReading } from '@/lib/bible-books';

const cache = new Map<string, BibleReading>();

export async function fetchBibleReading(ref: string): Promise<BibleReading> {
  if (cache.has(ref)) return cache.get(ref)!;
  const res = await fetch(`/api/bible?ref=${encodeURIComponent(ref)}`);
  const json = (await res.json()) as { success: boolean; data: BibleReading; error?: string };
  if (!json.success) throw new Error(json.error);
  cache.set(ref, json.data);
  return json.data;
}

export async function fetchDayReadings(
  refs: [string, string, string],
): Promise<Array<BibleReading | null>> {
  const results = await Promise.allSettled(refs.map(fetchBibleReading));
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}
