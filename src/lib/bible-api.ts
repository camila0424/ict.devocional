const BOOK_MAP: Record<string, string> = {
  He: 'acts',
  Hechos: 'acts',
  Jos: 'joshua',
  Josué: 'joshua',
  Jue: 'judges',
  Jueces: 'judges',
  Salm: 'psalms',
  Salmos: 'psalms',
  Rom: 'romans',
  Romanos: 'romans',
  Job: 'job',
  Rut: 'ruth',
  '1 Sam': '1samuel',
  '2 Sam': '2samuel',
  Sam: '1samuel',
};

export type BibleTextResult = {
  text: string;
  reference: string;
};

export async function fetchBibleText(verseRef: string): Promise<BibleTextResult> {
  const match = verseRef.match(/^(.*?)\s+(\d[\d:,\-\s]*)$/);
  if (!match) throw new Error('Referencia bíblica inválida');
  const [, bookRaw, ref] = match;
  if (!bookRaw || !ref) throw new Error('Referencia bíblica inválida');
  const book = BOOK_MAP[bookRaw.trim()] ?? bookRaw.trim().replace(/\s+/g, '+').toLowerCase();
  const slug = `${book}+${ref.trim().replace(/\s+/g, '+')}`;
  const res = await fetch(`https://bible-api.com/${slug}?translation=reinavalera1960`);
  if (!res.ok) throw new Error('No se pudo cargar el texto bíblico');
  const data = (await res.json()) as { text?: string; reference?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.text) throw new Error('Texto no disponible');
  return { text: data.text.trim(), reference: data.reference ?? verseRef };
}
