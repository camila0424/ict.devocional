import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { normalizeBibleText, stem, STOPWORDS } from './bible-search-text';

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
  // Último versículo cuando el fragmento buscado cruza dos versículos seguidos.
  verseEnd?: number;
  text: string;
  match: 'exact' | 'similar';
}

interface IndexedVerse {
  bookKey: string;
  chapterIndex: number;
  verseNumber: number;
  text: string;
  norm: string;
  stems: Set<string>;
  bigrams: Set<string>;
}

function bigramsOf(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) set.add(`${tokens[i]} ${tokens[i + 1]}`);
  return set;
}

// Umbral de parecido para mostrar un versículo como "similar" (0–1).
const MIN_SIMILAR_SCORE = 0.3;

interface SearchIndex {
  verses: IndexedVerse[];
  // En cuántos versículos aparece cada raíz: las palabras raras pesan más al comparar.
  docFreq: Map<string, number>;
}

const searchIndexCache = new Map<BibleVersion, SearchIndex>();

function getSearchIndex(version: BibleVersion): SearchIndex {
  const cached = searchIndexCache.get(version);
  if (cached) return cached;

  const index: IndexedVerse[] = [];
  const docFreq = new Map<string, number>();
  for (const key of CANONICAL_KEYS) {
    const book = loadBook(key, version);
    for (let chapterIndex = 0; chapterIndex < book.length; chapterIndex++) {
      const verses = book[chapterIndex] ?? [];
      for (let i = 0; i < verses.length; i++) {
        const text = verses[i];
        if (!text) continue;
        const norm = normalizeBibleText(text);
        const tokens = norm.split(' ').filter(Boolean);
        const stems = new Set(tokens.map(stem));
        for (const s of stems) docFreq.set(s, (docFreq.get(s) ?? 0) + 1);
        index.push({
          bookKey: key,
          chapterIndex,
          verseNumber: i + 1,
          text,
          norm,
          stems,
          bigrams: bigramsOf(tokens),
        });
      }
    }
  }

  const searchIndex = { verses: index, docFreq };
  searchIndexCache.set(version, searchIndex);
  return searchIndex;
}

function toResult(
  verse: IndexedVerse,
  match: BibleSearchResult['match'],
  next?: IndexedVerse,
): BibleSearchResult {
  return {
    bookKey: verse.bookKey,
    bookName: BOOK_NAMES_ES[verse.bookKey]!,
    chapterIndex: verse.chapterIndex,
    verseNumber: verse.verseNumber,
    ...(next ? { verseEnd: next.verseNumber } : {}),
    text: next ? `${verse.text} ${next.text}` : verse.text,
    match,
  };
}

// Busca una palabra o un fragmento del texto bíblico. Ignora tildes, mayúsculas y
// puntuación. Con fragmentos largos devuelve primero las coincidencias exactas (aunque
// crucen dos versículos) y luego los versículos más parecidos, ordenados por relevancia.
export function searchBible(query: string, version: BibleVersion, limit = 50): BibleSearchResult[] {
  const normQuery = normalizeBibleText(query);
  if (normQuery.length < 2) return [];

  const { verses: index, docFreq } = getSearchIndex(version);
  const queryTokens = normQuery.split(' ');
  const contentStems = [...new Set(queryTokens.filter((t) => !STOPWORDS.has(t)).map(stem))];

  // Palabra suelta o frase corta: coincidencia de palabras completas (admite plural)
  // en orden canónico. normQuery solo contiene [a-z0-9 ], así que es seguro en la regex.
  if (contentStems.length <= 2) {
    const wordRegex = new RegExp(`(^| )${normQuery}(s|es)?( |$)`);
    const results: BibleSearchResult[] = [];
    for (const verse of index) {
      if (!wordRegex.test(verse.norm)) continue;
      results.push(toResult(verse, 'exact'));
      if (results.length >= limit) break;
    }
    return results;
  }

  const paddedQuery = ` ${normQuery} `;
  const exact: BibleSearchResult[] = [];
  const exactKeys = new Set<number>();

  for (let i = 0; i < index.length; i++) {
    const verse = index[i]!;
    if (` ${verse.norm} `.includes(paddedQuery)) {
      exact.push(toResult(verse, 'exact'));
      exactKeys.add(i);
      continue;
    }
    // El fragmento puede empezar en un versículo y terminar en el siguiente.
    const next = index[i + 1];
    if (
      next &&
      next.bookKey === verse.bookKey &&
      next.chapterIndex === verse.chapterIndex &&
      !` ${next.norm} `.includes(paddedQuery) &&
      ` ${verse.norm} ${next.norm} `.includes(paddedQuery)
    ) {
      exact.push(toResult(verse, 'exact', next));
      exactKeys.add(i);
      exactKeys.add(i + 1);
    }
  }

  const queryBigrams = bigramsOf(queryTokens);
  const weights = contentStems.map((s) =>
    Math.log((index.length + 1) / ((docFreq.get(s) ?? 0) + 1)),
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  // Al menos la mitad de las palabras del fragmento, y nunca menos de 3 (o todas si hay menos).
  const minWordHits = Math.min(
    contentStems.length,
    Math.max(3, Math.ceil(contentStems.length / 2)),
  );
  const scored: { i: number; score: number }[] = [];

  for (let i = 0; i < index.length; i++) {
    if (exactKeys.has(i)) continue;
    const verse = index[i]!;

    let wordHits = 0;
    let hitWeight = 0;
    contentStems.forEach((s, k) => {
      if (!verse.stems.has(s)) return;
      wordHits++;
      hitWeight += weights[k]!;
    });
    if (wordHits < minWordHits) continue;
    const wordCoverage = hitWeight / totalWeight;

    let bigramHits = 0;
    for (const b of queryBigrams) if (verse.bigrams.has(b)) bigramHits++;
    const bigramCoverage = queryBigrams.size ? bigramHits / queryBigrams.size : 0;

    const score = wordCoverage * 0.6 + bigramCoverage * 0.4;
    if (score < MIN_SIMILAR_SCORE) continue;
    scored.push({ i, score });
  }

  // Estable: a igual puntuación se respeta el orden canónico.
  scored.sort((a, b) => b.score - a.score);

  const similar = scored
    .slice(0, Math.max(0, limit - exact.length))
    .map(({ i }) => toResult(index[i]!, 'similar'));

  return [...exact, ...similar].slice(0, limit);
}
