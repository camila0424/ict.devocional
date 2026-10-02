// Convierte los PDF de data-source/diccionarios en public/diccionario/<id>/<letra>.json
// Uso: node scripts/build-dictionary.mjs [id]   (sin id procesa todos)
// Requiere `pdftotext` (poppler) en el PATH.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'data-source', 'diccionarios');
const OUT = path.join(ROOT, 'public', 'diccionario');

const UPPER = 'A-ZÁÉÍÓÚÑÜ';

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

function cleanText(s) {
  return s
    .replace(/\(\s*<\d+>\s*/g, '(')
    .replace(/\s*<\d+>\s*/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .trim();
}

/** Mundo Hispano: un párrafo por línea, encabezado = "Término. texto" o "Término (heb., ...). texto". */
function parseMundoHispano(lines) {
  const start = lines.findIndex((l) => /^Aaron \(heb\./.test(l));
  const end = lines.findIndex((l) => /^Zurisadai/.test(l));
  if (start < 0 || end < 0) throw new Error('No se encontró el rango del diccionario');

  const entries = [];
  let last = null;
  let lastKey = '';

  const headRe = new RegExp(`^([${UPPER}][^.()]{0,50})`);
  const seeRe = new RegExp(
    `^([${UPPER}][^.()]{0,40}?), ver ([${UPPER}][${UPPER} ,]*[${UPPER}])(?:\\s+(.*))?$`,
  );

  const queue = lines.slice(start, end + 1);
  while (queue.length) {
    const line = queue.shift().trim();
    if (!line) continue;

    let term = null;
    let body = null;

    const see = line.match(seeRe);
    if (see) {
      term = see[1];
      body = `Ver ${see[2]}`;
      if (see[3]) queue.unshift(see[3]);
    } else {
      const head = line.match(headRe);
      if (head) {
        const name = head[1].trimEnd();
        let rest = line.slice(name.length);
        let ok = false;
        if (/^\.(\s|$)/.test(rest)) {
          rest = rest.slice(1);
          ok = true;
        } else if (rest.startsWith(' (')) {
          const close = rest.search(/\)\s*\./);
          if (close > 0 && close < 400) {
            rest = rest.slice(1, close + 1) + rest.slice(close + 1).replace(/^\s*\./, '.');
            ok = true;
          }
        }
        // Un encabezado real: pocas palabras, no es un numeral romano y respeta el orden alfabético
        // y que no sea una frase cortada en una abreviatura ("David nació en 1040 a. de J.C.")
        const sentence =
          /\d{3,}|[”"]| (que|se|para|tuvo|nació|prohíbe|hasta|desde|aprox|caps?|NT|AT) /i;
        if (
          ok &&
          name.split(/\s+/).length <= 5 &&
          !/^[IVXLC]+$/.test(name) &&
          !sentence.test(` ${name} `) &&
          !/^\s*[a-záéíóúñ]/.test(rest)
        ) {
          const key = norm(name);
          const jump = key.charCodeAt(0) - (lastKey.charCodeAt(0) || 97);
          if (key.length > 1 && jump >= 0 && jump <= 2 && key.slice(0, 3) >= lastKey.slice(0, 3)) {
            term = name;
            body = rest.trim();
          }
        }
      }
    }

    if (term) {
      last = { t: term, d: cleanText(body) };
      lastKey = norm(term);
      entries.push(last);
    } else if (last) {
      last.d += '\n' + cleanText(line);
    }
  }
  // Las remisiones ("Abeja, ver ANIMALES") solo sirven si apuntan a un artículo que existe y
  // si no hay ya un artículo propio con ese mismo título.
  const isSee = (e) => /^Ver [^\n]+$/.test(e.d);
  const realTitles = new Set(entries.filter((e) => !isSee(e)).map((e) => norm(e.t)));
  return entries
    .filter((e) => !isSee(e) || (!realTitles.has(norm(e.t)) && realTitles.has(norm(e.d.slice(4)))))
    .map((e) => ({ t: e.t, d: e.d.trim() }));
}

/**
 * Vine: encabezado en MAYÚSCULAS en su propia línea (AGUA), seguido de las palabras originales
 * (hebreo en la sección AT, griego en la NT). Un mismo término puede aparecer en ambas secciones.
 */
function parseVine(lines) {
  const otStart = lines.findIndex((l) => l.trim() === 'ABANDONAR, DEJAR');
  const ntMark = lines.findIndex((l) => /^NOTA DEL REDACTOR DE LA OBRA EN CASTELLANO/.test(l));
  const ntStart = lines.findIndex((l, i) => i > ntMark && l.trim() === 'ABAJO');
  const ntEnd = lines.findIndex((l) => /^Acerca de la Partícula kai/.test(l));
  if ([otStart, ntMark, ntStart, ntEnd].some((i) => i < 0)) {
    throw new Error('No se encontraron los rangos de Vine');
  }

  const headRe = /^[¡¿A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9 ,.()¡!¿?'’/-]+$/;
  const skip = /^(NOTA|VÉASE|VEASE)/;
  const byKey = new Map();

  const run = (from, to, label) => {
    let cur = null;
    for (let i = from; i < to; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.length > 2 && headRe.test(line) && !skip.test(line)) {
        const key = norm(line);
        if (!byKey.has(key)) byKey.set(key, { t: line, parts: {} });
        cur = byKey.get(key);
        cur.parts[label] ??= [];
        continue;
      }
      if (/^[A-ZÁÉÍÓÚÑ]$/.test(line) || /^Véase la nota sobre †/.test(line)) continue;
      if (cur) cur.parts[label].push(cleanText(line));
    }
  };
  run(otStart, ntMark, 'Antiguo Testamento');
  run(ntStart, ntEnd, 'Nuevo Testamento');

  const titleCase = (t) => t.charAt(0) + t.slice(1).toLowerCase();
  const out = [];
  for (const { t, parts } of byKey.values()) {
    const labels = Object.keys(parts).filter((k) => parts[k].length);
    if (!labels.length || /^(PRÓLOGO|PREFACIO|INTRODUCCIÓN|CONTENIDO)/.test(t)) continue;
    const d = labels
      .map((k) => (labels.length > 1 ? `[${k}]\n` : '') + parts[k].join('\n'))
      .join('\n\n');
    out.push({ t: titleCase(t), d });
  }
  return out;
}

const SOURCES = {
  'mundo-hispano': {
    file: 'DICCIONARIO BIBLICO.pdf',
    name: 'Diccionario Bíblico Mundo Hispano',
    parse: parseMundoHispano,
  },
  vine: {
    file: 'diccionario-biblico-vine-vine.pdf',
    name: 'Diccionario Expositivo de Vine',
    parse: parseVine,
  },
};

// Las remisiones ("Amor → Véanse AMAR, AMOR") se convierten en alias de la entrada real, así
// no hace falta cargar otras letras al buscar. Las que no apuntan a nada se descartan.
const SEE_PATTERN = /^\(?(véase|véanse|ver)\b/i;
const isSee = (e) => e.d.length < 200 && !e.d.includes('\n') && SEE_PATTERN.test(e.d);
const keysOf = (e) => [e.t, ...e.t.split(','), ...(e.k ?? [])].map(norm).filter(Boolean);

function resolveSeeAlso(entries) {
  const byKey = new Map();
  for (const e of entries.filter((x) => !isSee(x))) {
    for (const key of keysOf(e)) byKey.set(key, [...(byKey.get(key) ?? []), e]);
  }
  for (const stub of entries.filter(isSee)) {
    const targets = stub.d
      .replace(SEE_PATTERN, '')
      .replace(/^\s*también\b/i, '')
      .split(/[;,]|\by\b/)
      .map((part) => norm(part.replace(/N[ºo]\s*\d+/g, '')))
      .filter(Boolean);
    for (const target of targets) {
      for (const real of byKey.get(target) ?? []) {
        if (!keysOf(real).includes(norm(stub.t))) (real.k ??= []).push(stub.t);
      }
    }
  }
  return entries.filter((e) => !isSee(e));
}

// Un archivo por letra inicial (de cualquiera de las claves de la entrada): al buscar solo se
// descarga la letra de la palabra, no el diccionario entero.
function writeShards(id, entries) {
  const dir = path.join(OUT, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const shards = new Map();
  for (const entry of entries) {
    for (const letter of new Set(keysOf(entry).map((k) => (/^[a-z]/.test(k) ? k[0] : '_')))) {
      shards.set(letter, [...(shards.get(letter) ?? []), entry]);
    }
  }
  for (const [letter, list] of shards) {
    writeFileSync(path.join(dir, letter + '.json'), JSON.stringify(list));
  }
  return shards.size;
}

const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(path.join(tmpdir(), 'dict-'));

for (const [id, cfg] of Object.entries(SOURCES)) {
  if (only && only !== id) continue;
  const txt = path.join(tmp, id + '.txt');
  execFileSync('pdftotext', ['-enc', 'UTF-8', path.join(SRC, cfg.file), txt]);
  const lines = readFileSync(txt, 'utf8').split(/\r?\n/);
  const entries = resolveSeeAlso(cfg.parse(lines));
  rmSync(path.join(OUT, id + '.json'), { force: true });
  const files = writeShards(id, entries);
  console.log(id + ': ' + entries.length + ' entradas en ' + files + ' archivos');
}
