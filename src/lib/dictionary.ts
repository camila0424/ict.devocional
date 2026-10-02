// Diccionarios bíblicos: se cargan bajo demanda desde /diccionario/<id>.json (generados por
// scripts/build-dictionary.mjs) y se buscan por término, ignorando tildes y plurales simples.
import { normalizeBibleText, stem } from '@/lib/bible-search-text';

export const DICTIONARIES = [
  { id: 'mundo-hispano', name: 'Mundo Hispano', fullName: 'Diccionario Bíblico Mundo Hispano' },
  { id: 'vine', name: 'Vine', fullName: 'Diccionario Expositivo de Vine' },
] as const;

export type DictionaryId = (typeof DICTIONARIES)[number]['id'];

export type DictionaryEntry = { t: string; d: string };

type IndexedDictionary = {
  entries: DictionaryEntry[];
  // clave normalizada (título completo o cada parte separada por coma) → posiciones
  byKey: Map<string, number[]>;
};

const MAX_RESULTS = 40;
const MIN_PREFIX_LENGTH = 3;
const STUB_PATTERN = /^\(?(véase|véanse|ver)\b/i;

const cache = new Map<DictionaryId, Promise<IndexedDictionary>>();

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
  });
  return { entries, byKey };
}

export function loadDictionary(id: DictionaryId): Promise<IndexedDictionary> {
  let promise = cache.get(id);
  if (!promise) {
    promise = fetch(`/diccionario/${id}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el diccionario ${id}`);
        return res.json() as Promise<DictionaryEntry[]>;
      })
      .then(buildIndex)
      .catch((error) => {
        cache.delete(id); // permite reintentar
        throw error;
      });
    cache.set(id, promise);
  }
  return promise;
}

// Posiciones cuyo término coincide exactamente con la clave (o con su raíz).
function lookup(dict: IndexedDictionary, key: string): number[] {
  const found = new Set<number>(dict.byKey.get(key) ?? []);
  const keyStem = stem(key);
  for (const candidate of [keyStem, `${key}s`, `${key}es`]) {
    for (const index of dict.byKey.get(candidate) ?? []) found.add(index);
  }
  return [...found];
}

// "Véanse AMAR, AMOR." / "Ver ANIMALES" → posiciones de los términos a los que remite.
function resolveStub(dict: IndexedDictionary, body: string): number[] {
  const targets = body
    .replace(STUB_PATTERN, '')
    .replace(/^\s*(también|tambien)\b/i, '')
    .split(/[;,]|\by\b/)
    .map((part) => normalizeBibleText(part.replace(/N[ºo]\s*\d+/g, '')))
    .filter(Boolean);
  const found = new Set<number>();
  for (const target of targets) {
    for (const index of dict.byKey.get(target) ?? []) found.add(index);
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
  const ordered = [...ranked.entries()].sort(
    (a, b) => a[1] - b[1] || titleOf(a[0]).localeCompare(titleOf(b[0]), 'es'),
  );

  // Las entradas que solo remiten a otra ("Véase AMAR") se sustituyen por la entrada real
  const isStub = (entry: DictionaryEntry) =>
    entry.d.length < 200 && !entry.d.includes('\n') && STUB_PATTERN.test(entry.d);
  const result: DictionaryEntry[] = [];
  const seen = new Set<number>();
  const push = (index: number) => {
    const entry = dict.entries[index];
    if (!entry || seen.has(index)) return;
    seen.add(index);
    result.push(entry);
  };
  for (const [index] of ordered) {
    const entry = dict.entries[index];
    if (!entry) continue;
    if (!isStub(entry)) {
      push(index);
      continue;
    }
    const targets = resolveStub(dict, entry.d).filter((target) => {
      const targetEntry = dict.entries[target];
      return !!targetEntry && !STUB_PATTERN.test(targetEntry.d);
    });
    if (targets.length) targets.forEach(push);
    else push(index);
  }

  return result.slice(0, MAX_RESULTS);
}
