// Utilidades puras (sin fs) para reconocer en el buscador referencias como "salmos 145",
// "Juan 3:16", "1 juan 4 7-8" o "gen 1", y llevar directamente al capítulo.

export interface ReferenceBook {
  key: string;
  nameEs: string;
  chapterCount: number;
}

export interface BibleReferenceMatch {
  bookKey: string;
  bookName: string;
  chapterIndex: number;
  verseStart: number | null;
  verseEnd: number | null;
}

// Minúsculas, sin tildes y sin espacios: "1 Crónicas" -> "1cronicas".
function compact(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Libro (opcionalmente con número delante) + capítulo, y opcionalmente versículo o rango.
// El versículo se separa con ":", "." "," o un espacio: "sal 23:1", "sal 23.1", "sal 23 1".
const REFERENCE_REGEX =
  /^([1-3]?\s*[a-zñ]+(?:\s+[a-zñ]+)*)\s*(\d{1,3})(?:\s*[:.,\s]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?$/;

export function parseBibleReference(
  query: string,
  books: ReferenceBook[],
): BibleReferenceMatch | null {
  const cleaned = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  const match = REFERENCE_REGEX.exec(cleaned);
  if (!match) return null;

  const [, bookPart, chapterPart, verseStartPart, verseEndPart] = match;
  const bookQuery = compact(bookPart!);
  if (bookQuery.replace(/\d/g, '').length < 2) return null;

  // Nombre exacto primero; si no, el primer libro (en orden canónico) que empieza así.
  const book =
    books.find((b) => compact(b.nameEs) === bookQuery) ??
    books.find((b) => compact(b.nameEs).startsWith(bookQuery));
  if (!book) return null;

  const chapter = Number(chapterPart);
  if (chapter < 1 || chapter > book.chapterCount) return null;

  const verseStart = verseStartPart ? Number(verseStartPart) : null;
  if (verseStart === 0) return null;
  const verseEnd =
    verseStart && verseEndPart && Number(verseEndPart) > verseStart ? Number(verseEndPart) : null;

  return {
    bookKey: book.key,
    bookName: book.nameEs,
    chapterIndex: chapter - 1,
    verseStart,
    verseEnd,
  };
}

export function referenceLabel(ref: BibleReferenceMatch): string {
  const verses = ref.verseStart
    ? `:${ref.verseStart}${ref.verseEnd ? `-${ref.verseEnd}` : ''}`
    : '';
  return `${ref.bookName} ${ref.chapterIndex + 1}${verses}`;
}

export function referenceHref(ref: BibleReferenceMatch): string {
  const base = `/biblia/${ref.bookKey}/${ref.chapterIndex}`;
  if (!ref.verseStart) return base;
  return `${base}?v=${ref.verseStart}${ref.verseEnd ? `-${ref.verseEnd}` : ''}`;
}
