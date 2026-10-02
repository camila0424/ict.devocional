'use client';

import { useState } from 'react';
import { BookA } from 'lucide-react';

// Campo "Buscar en el diccionario" para la hoja de un versículo: se escribe una palabra
// (p. ej. una que aparece en el versículo) y se abre el diccionario con su significado.
export function DictionaryLookup({ onSearch }: { onSearch: (word: string) => void }) {
  const [word, setWord] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = word.trim();
    if (value.length < 2) return;
    onSearch(value);
    setWord('');
  }

  return (
    <form onSubmit={submit} className="border-border mt-4 border-t pt-4">
      <label
        htmlFor="verse-dictionary-lookup"
        className="mb-2 flex items-center gap-1.5 text-sm font-semibold"
      >
        <BookA size={16} className="text-muted" />
        Buscar en el diccionario
      </label>
      <div className="flex gap-2">
        <input
          id="verse-dictionary-lookup"
          type="search"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Escribe una palabra…"
          autoCapitalize="none"
          autoCorrect="off"
          className="border-border bg-background min-w-0 flex-1 rounded-xl border px-3 py-2 text-base outline-none"
        />
        <button
          type="submit"
          disabled={word.trim().length < 2}
          className="bg-primary rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
