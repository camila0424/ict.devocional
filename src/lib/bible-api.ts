export type BibleTextResult = {
  text: string;
  reference: string;
};

export async function fetchBibleText(
  bookFull: string,
  reference: string,
): Promise<BibleTextResult> {
  const slug = `${bookFull} ${reference}`.replace(/\s+/g, '+').toLowerCase();
  const res = await fetch(`https://bible-api.com/${slug}?translation=reinavalera1960`);
  if (!res.ok) throw new Error('No se pudo cargar el texto bíblico');
  const data = (await res.json()) as { text?: string; reference?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.text) throw new Error('Texto no disponible');
  return { text: data.text.trim(), reference: data.reference ?? `${bookFull} ${reference}` };
}
