// Utilidades puras (sin fs) para comparar texto bíblico: las usa el buscador en el
// servidor y el resaltado de palabras en el cliente.

// Palabras vacías: no cuentan para medir parecido entre un fragmento y un versículo.
export const STOPWORDS = new Set(
  (
    'a al ante con contra de del desde e en entre hacia hasta la las le les lo los me mi mis ' +
    'ni no nos o os para pero por que se si sin sobre su sus te ti tu tus u un una unos unas ' +
    'y ya yo el es fue son era como cual cuando donde mas muy este esta estos estas ese esa ' +
    'esos esas aquel aquella aquellos aquellas tambien porque pues asi ha he han has hay'
  ).split(' '),
);

// Minúsculas, sin tildes ni puntuación, espacios colapsados.
export function normalizeBibleText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Raíz muy simple para que "ley"/"leyes" o "corazon"/"corazones" coincidan.
export function stem(token: string): string {
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

// Raíces de las palabras con contenido de una búsqueda (sin palabras vacías).
export function contentStemsOf(query: string): string[] {
  const tokens = normalizeBibleText(query).split(' ').filter(Boolean);
  const content = tokens.filter((t) => !STOPWORDS.has(t));
  return [...new Set((content.length ? content : tokens).map(stem))];
}
