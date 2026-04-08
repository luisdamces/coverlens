import { canonicalizePlatform } from './platformUtils';

const SPLIT_RE = /[,;]/;

/**
 * Parte una cadena de plataforma Playnite/IGDB (posibles listas separadas por coma o ;)
 * y devuelve nombres canónicos únicos.
 */
export function expandPlatformVariants(raw: string): string[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<string>();
  for (const p of parts) {
    const c = canonicalizePlatform(p);
    if (c && c !== 'Plataforma desconocida') out.add(c);
  }
  return Array.from(out);
}

/** Lista ordenada de plataformas canónicas presentes en el catálogo (para desplegable). */
export function uniqueCanonicalPlatforms(games: { platform: string }[]): string[] {
  const set = new Set<string>();
  for (const g of games) {
    for (const v of expandPlatformVariants(g.platform)) {
      set.add(v);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

/** Filtro: el juego coincide si alguna de sus plataformas canónicas es `filter`. */
export function gameMatchesPlatformFilter(gamePlatform: string, filter: string | null): boolean {
  const f = filter?.trim();
  if (!f) return true;
  return expandPlatformVariants(gamePlatform).includes(f);
}

/** Normaliza texto guardado en BD: trocea, canoniza cada parte, deduplica, reune. */
export function normalizePlatformFieldForStorage(raw: string): string {
  const parts = raw
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return raw.trim();
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const p of parts) {
    const c = canonicalizePlatform(p);
    if (!seen.has(c)) {
      seen.add(c);
      ordered.push(c);
    }
  }
  return ordered.join(', ');
}
