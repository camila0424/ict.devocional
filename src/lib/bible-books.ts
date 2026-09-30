import path from 'path';
import { readFileSync } from 'fs';
import { KEY_TO_NAME, resolveBookKey, splitReading } from './bible-book-aliases';

export interface BibleVerse {
  number: number;
  text: string;
}
export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}
export interface BibleReading {
  reference: string;
  bookKey: string;
  // bookKey canónico del lector de la Biblia (el de arriba es el nombre del archivo RVR1960)
  bibleKey: string;
  bookName: string;
  chapters: BibleChapter[];
}

// Los nombres y abreviaturas de los libros viven en bible-book-aliases (sin fs, lo usa el cliente)
export { KEY_TO_NAME };

// Parsea "He 14", "He 15:1-21", "Jos 23-24", "Jue 10:1-11:33", "1 Sam 1:1-2:11",
// "1 Cró 20-22:1" y el libro solo ("2 Jn", "Abd"), que el plan usa para libros de un capítulo.
// Acepta cualquier abreviatura o nombre de libro (ver bible-book-aliases) y erratas de formato
// de las guías: "2 Sam16", "Jeremías1-2", "Mar 4 1-20", "Mar 12 :1-27", "Mar 15) 21-47".
export function parseReference(fullRef: string): {
  bookKey: string;
  bookName: string;
  chapters: BibleChapter[];
} {
  const split = splitReading(fullRef);
  if (!split) throw new Error(`Referencia inválida: "${fullRef}"`);
  const { book, reference: ref } = split;
  const firstChapter = Number(/^\d+/.exec(ref)?.[0] ?? 0);
  const bookKey = resolveBookKey(book, firstChapter);
  if (!bookKey) throw new Error(`Abreviatura no reconocida: "${book}"`);
  const bookName = KEY_TO_NAME[bookKey] ?? bookKey;
  const bookData = loadBook(bookKey);
  const segments: Seg[] = ref
    ? buildSegments(ref)
    : bookData.map((_, i) => ({ c: i + 1, v1: 1, v2: null }));
  const chapters = segments.map((seg) => ({
    number: seg.c,
    verses: extractVerses(bookData, seg),
  }));
  return { bookKey, bookName, chapters };
}

interface Seg {
  c: number;
  v1: number;
  v2: number | null;
}

function buildSegments(ref: string): Seg[] {
  // "10:1-11:33"
  const cc = ref.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (cc) {
    const [, c1, v1, c2, v2] = cc.map(Number);
    return Array.from({ length: c2! - c1! + 1 }, (_, i) => ({
      c: c1! + i,
      v1: c1! + i === c1 ? v1! : 1,
      v2: c1! + i === c2 ? v2! : null,
    }));
  }
  // "20-22:1" — capítulos completos hasta un versículo del último
  const cr = ref.match(/^(\d+)-(\d+):(\d+)$/);
  if (cr) {
    const [, c1, c2, v2] = cr.map(Number);
    return Array.from({ length: c2! - c1! + 1 }, (_, i) => ({
      c: c1! + i,
      v1: 1,
      v2: c1! + i === c2 ? v2! : null,
    }));
  }
  // "15:1-21"
  const cv = ref.match(/^(\d+):(\d+)-(\d+)$/);
  if (cv) {
    const [, c, v1, v2] = cv.map(Number);
    return [{ c: c!, v1: v1!, v2: v2! }];
  }
  // "23-24"
  const mc = ref.match(/^(\d+)-(\d+)$/);
  if (mc) {
    const [, c1, c2] = mc.map(Number);
    return Array.from({ length: c2! - c1! + 1 }, (_, i) => ({ c: c1! + i, v1: 1, v2: null }));
  }
  // "42:1" — single chapter with start verse, reads to end of chapter
  const sv = ref.match(/^(\d+):(\d+)$/);
  if (sv) {
    const [, c, v1] = sv.map(Number);
    return [{ c: c!, v1: v1!, v2: null }];
  }
  // "14"
  const sc = ref.match(/^(\d+)$/);
  if (sc) return [{ c: +sc[1]!, v1: 1, v2: null }];
  throw new Error(`Formato no reconocido: "${ref}"`);
}

function extractVerses(data: string[][], seg: Seg): BibleVerse[] {
  const ch = data[seg.c - 1];
  if (!ch) return [];
  const start = seg.v1 - 1;
  const end = seg.v2 ?? ch.length;
  return ch.slice(start, end).map((text, i) => ({ number: start + i + 1, text: text.trim() }));
}

// Caché en memoria — no releer disco en cada request
const cache = new Map<string, string[][]>();
function loadBook(key: string): string[][] {
  if (cache.has(key)) return cache.get(key)!;
  const p = path.join(process.cwd(), 'public', 'bible', `${key}.json`);
  const data = JSON.parse(readFileSync(p, 'utf-8')) as string[][];
  cache.set(key, data);
  return data;
}

// Comprueba que una lectura del plan se pueda cargar: libro reconocido y capítulos y
// versículos que existen. Devuelve el motivo del fallo, o null si es válida.
export function validateReading(fullRef: string): string | null {
  try {
    const { bookName, chapters } = parseReference(fullRef);
    const missing = chapters.find((c) => c.verses.length === 0);
    if (chapters.length === 0 || missing) {
      return `${bookName} no tiene el capítulo o los versículos indicados`;
    }
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
