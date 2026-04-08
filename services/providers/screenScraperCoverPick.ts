import { canonicalizePlatform } from '../utils/platformUtils';
import { bestMatchIndex } from '../utils/titleUtils';

export type RawGame = {
  id?: number;
  nom?: string;
  noms?: { nom_us?: string; nom_eu?: string; nom_jp?: string };
  genres?: { genre_1?: string } | Array<{ nom?: string; noms?: Array<{ text?: string }> }>;
  developpeur?: { text?: string };
  editeur?: { text?: string };
  dates?: { date_us?: string; date_eu?: string; date_jp?: string };
  systeme?: { nom?: string } | { id?: number; nom?: string };
  medias?: Array<{ type?: string; url?: string; region?: string }>;
};

export function extractTitle(game: RawGame, fallback: string): string {
  return (
    game.noms?.nom_eu ??
    game.noms?.nom_us ??
    game.noms?.nom_jp ??
    game.nom ??
    fallback
  );
}

export function extractPlatform(game: RawGame): string {
  const sys = game.systeme;
  if (!sys) return 'Plataforma desconocida';
  if (typeof sys === 'object' && 'nom' in sys) return (sys as { nom?: string }).nom ?? 'Plataforma desconocida';
  return 'Plataforma desconocida';
}

function platformMatchesHint(gamePlatform: string, hint: string | null | undefined): boolean {
  const h = hint?.trim();
  if (!h) return true;
  const a = canonicalizePlatform(gamePlatform);
  const b = canonicalizePlatform(h);
  if (a === b) return true;
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la.includes(lb) || lb.includes(la)) return true;
  const gl = gamePlatform.toLowerCase();
  const hl = h.toLowerCase();
  return gl.includes(hl) || hl.includes(gl);
}

/** Elige entrada cuyo systeme encaje con la plataforma del catálogo (p. ej. Xbox 360 vs PC). */
export function pickBestGameForCover(
  list: RawGame[],
  title: string,
  platformHint: string | null | undefined
): RawGame {
  if (list.length === 0) {
    throw new Error('pickBestGameForCover: lista vacía');
  }
  const hint = platformHint?.trim();
  const filtered = hint ? list.filter((g) => platformMatchesHint(extractPlatform(g), hint)) : list;
  const pool = filtered.length > 0 ? filtered : list;
  const candidateTitles = pool.map((g) => extractTitle(g, ''));
  const bestIdx = bestMatchIndex(title, candidateTitles);
  return pool[bestIdx >= 0 ? bestIdx : 0];
}
