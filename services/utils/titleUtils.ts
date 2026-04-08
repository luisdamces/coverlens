/**
 * Limpia un título de juego para comparación o búsqueda.
 * Inspirado en el algoritmo de sanitización de Playnite:
 * - Minúsculas
 * - Sin marcas registradas
 * - Sin apóstrofes (Marvel's → marvels)
 * - Puntuación → espacios
 * - Sin artículos (the, a, an)
 * - Números romanos → dígitos
 * - Sin espacios dobles
 */
export function cleanGameTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[''`]/g, '')
    .replace(/[-:;.,!?()[\]]/g, ' ')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\b(viii)\b/g, '8')
    .replace(/\b(vii)\b/g, '7')
    .replace(/\b(vi)\b/g, '6')
    .replace(/\b(iv)\b/g, '4')
    .replace(/\b(iii)\b/g, '3')
    .replace(/\b(ii)\b/g, '2')
    .replace(/\b(ix)\b/g, '9')
    .replace(/\b(xi)\b/g, '11')
    .replace(/\b(xii)\b/g, '12')
    .replace(/\b(v)\b/g, '5')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Puntúa qué tan bien coincide un candidato con la búsqueda.
 * Devuelve un número de 0 a 100.
 * - 100: coincidencia exacta tras limpiar
 * - 90: uno contiene al otro
 * - 0–80: proporción de palabras coincidentes
 */
export function scoreMatch(query: string, candidate: string): number {
  const q = cleanGameTitle(query);
  const c = cleanGameTitle(candidate);

  if (!q || !c) return 0;
  if (q === c) return 100;
  if (c.includes(q) || q.includes(c)) return 90;

  const qWords = q.split(' ').filter(Boolean);
  const cWordSet = new Set(c.split(' ').filter(Boolean));

  if (qWords.length === 0) return 0;

  const matched = qWords.filter((w) => cWordSet.has(w)).length;
  return Math.round((matched / qWords.length) * 80);
}

/**
 * Dado un array de candidatos con nombre, devuelve el índice del que
 * mejor puntúa contra la query. Devuelve -1 si no hay candidatos.
 */
export function bestMatchIndex(query: string, candidates: string[]): number {
  if (candidates.length === 0) return -1;
  if (!query) return 0;

  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < candidates.length; i++) {
    const score = scoreMatch(query, candidates[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}
