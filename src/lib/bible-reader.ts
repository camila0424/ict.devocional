import { readFileSync, existsSync } from 'fs';
import path from 'path';

export type BibleVersion = 'RVR1960' | 'NTV';

export interface BibleBook {
  nameEs: string;
  key: string;
}

// Nombres en español por bookKey canónico (mismo orden que los 66 libros).
const BOOK_NAMES_ES: Record<string, string> = {
  genesis: 'Génesis',
  exodus: 'Éxodo',
  leviticus: 'Levítico',
  numbers: 'Números',
  deuteronomy: 'Deuteronomio',
  joshua: 'Josué',
  judges: 'Jueces',
  ruth: 'Rut',
  '1samuel': '1 Samuel',
  '2samuel': '2 Samuel',
  '1kings': '1 Reyes',
  '2kings': '2 Reyes',
  '1chronicles': '1 Crónicas',
  '2chronicles': '2 Crónicas',
  ezra: 'Esdras',
  nehemiah: 'Nehemías',
  esther: 'Ester',
  job: 'Job',
  psalms: 'Salmos',
  proverbs: 'Proverbios',
  ecclesiastes: 'Eclesiastés',
  songofsolomon: 'Cantares',
  isaiah: 'Isaías',
  jeremiah: 'Jeremías',
  lamentations: 'Lamentaciones',
  ezekiel: 'Ezequiel',
  daniel: 'Daniel',
  hosea: 'Oseas',
  joel: 'Joel',
  amos: 'Amós',
  obadiah: 'Abdías',
  jonah: 'Jonás',
  micah: 'Miqueas',
  nahum: 'Nahúm',
  habakkuk: 'Habacuc',
  zephaniah: 'Sofonías',
  haggai: 'Hageo',
  zechariah: 'Zacarías',
  malachi: 'Malaquías',
  matthew: 'Mateo',
  mark: 'Marcos',
  luke: 'Lucas',
  john: 'Juan',
  acts: 'Hechos',
  romans: 'Romanos',
  '1corinthians': '1 Corintios',
  '2corinthians': '2 Corintios',
  galatians: 'Gálatas',
  ephesians: 'Efesios',
  philippians: 'Filipenses',
  colossians: 'Colosenses',
  '1thessalonians': '1 Tesalonicenses',
  '2thessalonians': '2 Tesalonicenses',
  '1timothy': '1 Timoteo',
  '2timothy': '2 Timoteo',
  titus: 'Tito',
  philemon: 'Filemón',
  hebrews: 'Hebreos',
  james: 'Santiago',
  '1peter': '1 Pedro',
  '2peter': '2 Pedro',
  '1john': '1 Juan',
  '2john': '2 Juan',
  '3john': '3 Juan',
  jude: 'Judas',
  revelation: 'Apocalipsis',
};

const CANONICAL_KEYS = Object.keys(BOOK_NAMES_ES);

const BIBLE_DIR = path.join(process.cwd(), 'public', 'bible');
const NTV_DIR = path.join(BIBLE_DIR, 'ntv');

// Los archivos de RVR1960 usan claves en español (ver public/bible/_index.json),
// mientras que los de NTV usan las claves canónicas en inglés. Este mapa traduce
// bookKey -> nombre de archivo real para RVR1960, alineando por posición con
// _index.json (mismo orden canónico de 66 libros).
let rvrFileKeyMap: Record<string, string> | null = null;

function getRvrFileKeyMap(): Record<string, string> {
  if (rvrFileKeyMap) return rvrFileKeyMap;

  const map: Record<string, string> = {};
  const indexPath = path.join(BIBLE_DIR, '_index.json');

  if (existsSync(indexPath)) {
    const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as { key: string }[];
    index.forEach((entry, i) => {
      const canonicalKey = CANONICAL_KEYS[i];
      if (canonicalKey) map[canonicalKey] = entry.key;
    });
  }

  for (const key of CANONICAL_KEYS) {
    if (!map[key]) map[key] = key;
  }

  rvrFileKeyMap = map;
  return map;
}

function getFilePath(bookKey: string, version: BibleVersion): string {
  if (version === 'NTV') {
    return path.join(NTV_DIR, `${bookKey}.json`);
  }
  const fileKey = getRvrFileKeyMap()[bookKey] ?? bookKey;
  return path.join(BIBLE_DIR, `${fileKey}.json`);
}

const bookCache = new Map<string, string[][]>();

function loadBook(bookKey: string, version: BibleVersion): string[][] {
  const cacheKey = `${version}:${bookKey}`;
  const cached = bookCache.get(cacheKey);
  if (cached) return cached;

  const filePath = getFilePath(bookKey, version);
  if (!existsSync(filePath)) {
    throw new Error(`No se encontró el libro "${bookKey}" (${version}) en ${filePath}`);
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as string[][];
  bookCache.set(cacheKey, data);
  return data;
}

export function getBibleBooks(): BibleBook[] {
  return CANONICAL_KEYS.map((key) => ({ nameEs: BOOK_NAMES_ES[key]!, key }));
}

export function getChapter(bookKey: string, chapterIndex: number, version: BibleVersion): string[] {
  const book = loadBook(bookKey, version);
  const chapter = book[chapterIndex];
  if (!chapter) {
    throw new Error(`No se encontró el capítulo ${chapterIndex} de "${bookKey}" (${version})`);
  }
  return chapter;
}

export function getChapterCount(bookKey: string, version: BibleVersion): number {
  return loadBook(bookKey, version).length;
}

export function getVerseCount(
  bookKey: string,
  chapterIndex: number,
  version: BibleVersion,
): number {
  return getChapter(bookKey, chapterIndex, version).length;
}

export interface BibleSearchResult {
  bookKey: string;
  bookName: string;
  chapterIndex: number;
  verseNumber: number;
  text: string;
}

export function searchBible(query: string, version: BibleVersion, limit = 50): BibleSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const results: BibleSearchResult[] = [];

  for (const key of CANONICAL_KEYS) {
    const book = loadBook(key, version);
    for (let chapterIndex = 0; chapterIndex < book.length; chapterIndex++) {
      const verses = book[chapterIndex] ?? [];
      for (let i = 0; i < verses.length; i++) {
        const text = verses[i];
        if (!text || !text.toLowerCase().includes(normalized)) continue;
        results.push({
          bookKey: key,
          bookName: BOOK_NAMES_ES[key]!,
          chapterIndex,
          verseNumber: i + 1,
          text,
        });
        if (results.length >= limit) return results;
      }
    }
  }

  return results;
}
