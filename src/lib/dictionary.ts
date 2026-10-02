// Diccionarios bíblicos: se cargan bajo demanda desde /diccionario/<id>/<letra>.json (generados
// por scripts/build-dictionary.mjs). Al buscar solo se descarga la letra inicial de la palabra.
import { normalizeBibleText, stem } from '@/lib/bible-search-text';

export const DICTIONARIES = [
  { id: 'mundo-hispano', name: 'Mundo Hispano', fullName: 'Diccionario Bíblico Mundo Hispano' },
  { id: 'vine', name: 'Vine', fullName: 'Diccionario Expositivo de Vine' },
] as const;

export type DictionaryId = (typeof DICTIONARIES)[number]['id'];

// `k` son alias: otros términos que remiten a esta entrada ("Amor" → "Amar, amor")
export type DictionaryEntry = { t: string; d: string; k?: string[] };

export type IndexedDictionary = {
  entries: DictionaryEntry[];
  // clave normalizada (título, cada parte separada por coma, alias) → posiciones
  byKey: Map<string, number[]>;
};

const MAX_RESULTS = 40;
const MIN_PREFIX_LENGTH = 3;

const cache = new Map<string, Promise<IndexedDictionary>>();

// Archivo (letra) donde está una palabra; lo que no empieza por a-z va a "_".
export function shardLetter(word: string): string {
  const first = normalizeBibleText(word).charAt(0);
  return /^[a-z]$/.test(first) ? first : '_';
}

function addKey(byKey: Map<string, number[]>, key: string, index: number) {
  if (!key) return;
  const list = byKey.get(key);
  if (!list) byKey.set(key, [index]);
  else if (!list.includes(index)) list.push(index);
}

function buildIndex(entries: DictionaryEntry[]): IndexedDictionary {
  const byKey = new Map<string, number[]>();
  entries.forEach((entry, index) => {
    addKey(byKey, normalizeBibleText(entry.t), index);
    for (const part of entry.t.split(',')) addKey(byKey, normalizeBibleText(part), index);
    for (const alias of entry.k ?? []) addKey(byKey, normalizeBibleText(alias), index);
  });
  return { entries, byKey };
}

export function loadDictionary(id: DictionaryId, word: string): Promise<IndexedDictionary> {
  const letter = shardLetter(word);
  const cacheKey = `${id}/${letter}`;
  let promise = cache.get(cacheKey);
  if (!promise) {
    promise = fetch(`/diccionario/${id}/${letter}.json`)
      .then((res) => {
        if (res.status === 404) return [] as DictionaryEntry[]; // ningún término con esa letra
        if (!res.ok) throw new Error(`No se pudo cargar el diccionario ${cacheKey}`);
        return res.json() as Promise<DictionaryEntry[]>;
      })
      .then(buildIndex)
      .catch((error) => {
        cache.delete(cacheKey); // permite reintentar
        throw error;
      });
    cache.set(cacheKey, promise);
  }
  return promise;
}

// Posiciones cuyo término coincide exactamente con la clave (o con su singular/plural).
function lookup(dict: IndexedDictionary, key: string): number[] {
  const found = new Set<number>(dict.byKey.get(key) ?? []);
  for (const candidate of [stem(key), `${key}s`, `${key}es`]) {
    for (const index of dict.byKey.get(candidate) ?? []) found.add(index);
  }
  return [...found];
}

export function searchDictionary(dict: IndexedDictionary, query: string): DictionaryEntry[] {
  const key = normalizeBibleText(query);
  if (!key) return [];

  const ranked = new Map<number, number>(); // posición → rango (menor = mejor)
  const rank = (index: number, value: number) => {
    const current = ranked.get(index);
    if (current === undefined || value < current) ranked.set(index, value);
  };

  for (const index of lookup(dict, key)) rank(index, 0);

  if (key.length >= MIN_PREFIX_LENGTH) {
    for (const [candidate, indexes] of dict.byKey) {
      if (candidate !== key && candidate.startsWith(key)) {
        for (const index of indexes) rank(index, 1);
      }
    }
  }

  const titleOf = (index: number) => dict.entries[index]?.t ?? '';
  return [...ranked.entries()]
    .sort((a, b) => a[1] - b[1] || titleOf(a[0]).localeCompare(titleOf(b[0]), 'es'))
    .slice(0, MAX_RESULTS)
    .flatMap(([index]) => dict.entries[index] ?? []);
}
