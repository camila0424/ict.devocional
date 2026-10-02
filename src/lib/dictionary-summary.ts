// Resúmenes cortos para mostrar la definición concreta antes del texto completo.
import type { DictionaryEntry } from '@/lib/dictionary';

export type EntrySummary = {
  // Vine: una línea por palabra original ("tsarah" → "aflicción, angustia, aprietos")
  words: { word: string; gloss: string }[];
  // Mundo Hispano y resto: primera frase o dos del artículo
  text: string;
};

const MAX_WORDS = 4;
const MAX_GLOSS = 90;
const MAX_TEXT = 240;
const MIN_TEXT = 90;

// "tsarah (6869 ,‫)צָרָה‬, «aflicción, angustia»" · "faino (φαίνω, 5316), hacer aparecer"
const WORD_LINE = /^(?:\d+\.\s*)?(\S{2,24}(?: \S{2,24})?) \([^)]*\d{1,5}[^)]*\)/u;
const GUILLEMETS = /«([^»]{2,200})(?:»|$)/u;
// Marcas de dirección y letras hebreas que el PDF intercala junto a las palabras originales
const RTL_NOISE = /[֐-׿‎‏‪-‮]/gu;
const WORD_ONLY = /^[\p{L}˒˓’'-]+$/u;
const GLOSS_LEAD = /^(significa(?:n)?|denota|tiene(?:n)? el significado de|se utiliza(?: de)?)\s+/i;
const ABBREVIATIONS = new Set(
  'a d p ej aprox cf cap caps heb gr lat lit ver vv v etc ss pp no sr dr'.split(' '),
);

function trimGloss(raw: string): string {
  let gloss = raw.replace(/\s+/g, ' ').trim();
  gloss = gloss.replace(/^[,:;\s]+/, '').replace(GLOSS_LEAD, '');
  gloss = gloss.split(/[.;:(]/)[0]?.trim() ?? '';
  if (gloss.length > MAX_GLOSS) gloss = `${gloss.slice(0, MAX_GLOSS).trimEnd()}…`;
  return gloss;
}

function vineWords(entry: DictionaryEntry): EntrySummary['words'] {
  const words: EntrySummary['words'] = [];
  const seen = new Set<string>();
  for (const line of entry.d.split('\n')) {
    const head = line.match(WORD_LINE);
    if (!head?.[1]) continue;
    const word = head[1].replace(/^[˒˓’']+/, '').trim();
    if (!WORD_ONLY.test(word)) continue;
    const rest = line.slice(head[0].length).replace(RTL_NOISE, '').trimStart();
    // Formato hebreo: «significado»; formato griego: "palabra (griego, 123), significado"
    const quoted = rest.slice(0, 200).match(GUILLEMETS)?.[1];
    if (!quoted && !rest.startsWith(',')) continue;
    const gloss = trimGloss(quoted ?? rest);
    if (!gloss || gloss.endsWith('…') || seen.has(word)) continue;
    seen.add(word);
    words.push({ word, gloss });
  }
  return words;
}

// Divide en frases sin cortar tras abreviaturas ("a. de J.C.", "p. ej.") ni numerales ("1.").
function sentences(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
  const boundary = /([.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«“(])/g;
  for (let match = boundary.exec(text); match; match = boundary.exec(text)) {
    const before = text.slice(start, match.index).split(/\s+/).pop() ?? '';
    if (ABBREVIATIONS.has(before.toLowerCase()) || /^\d+$/.test(before)) continue;
    parts.push(text.slice(start, match.index + 1));
    start = match.index + match[0].length;
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function leadText(entry: DictionaryEntry): string {
  const body = entry.d
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^\([^)]*\)\.?\s*/, '') // etimología: "(heb., ’emun; gr., pistis)."
    .replace(/\s+/g, ' ')
    .trim();
  let result = '';
  for (const sentence of sentences(body)) {
    result = result ? `${result} ${sentence}` : sentence;
    if (result.length >= MIN_TEXT) break;
  }
  if (result.length > MAX_TEXT) {
    result = `${result.slice(0, MAX_TEXT).replace(/\s+\S*$/, '')}…`;
  }
  return result;
}

export function summarizeEntry(entry: DictionaryEntry): EntrySummary {
  const words = vineWords(entry);
  return {
    words: words.slice(0, MAX_WORDS),
    text: words.length ? '' : leadText(entry),
  };
}

export function extraWordCount(entry: DictionaryEntry): number {
  return Math.max(0, vineWords(entry).length - MAX_WORDS);
}
