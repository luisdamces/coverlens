import { getApiCredentials } from '../credentialsStore';
import { bestMatchIndex, cleanGameTitle } from '../utils/titleUtils';

/**
 * Tamaños de grid a probar (de menor a mayor peso). Algunos juegos no tienen 467×600 pero sí 600×900.
 * Filtrar por plataforma en la API de grids es limitado (p. ej. steam/flashpoint); elegimos el juego
 * que mejor encaje por nombre con el título de la ficha.
 */
const STEAMGRID_DIMENSIONS_PREF = ['342x482', '467x600', '600x900'] as const;

type SgSearchRow = { id: number; name: string };

async function fetchGridForGameId(apiKey: string, gameId: number): Promise<string | null> {
  for (const dimensions of STEAMGRID_DIMENSIONS_PREF) {
    const gridResponse = await fetch(
      `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=${dimensions}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!gridResponse.ok) continue;
    const gridPayload = (await gridResponse.json()) as { data?: Array<{ url?: string }> };
    const url = gridPayload.data?.[0]?.url;
    if (url) return url;
  }
  return null;
}

/** Quita «(2002)»; si había año entre paréntesis, también la última palabra (p. ej. autor de grid «Castcoder»). */
function steamGridSearchQueryVariants(title: string): string[] {
  const raw = title.trim();
  if (!raw) return [];
  const hadYearParen = /\(\d{4}\)/.test(raw);
  const noYear = raw.replace(/\s*\(\d{4}\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  const noTrailingToken = hadYearParen
    ? noYear.replace(/\s+[A-Za-z0-9][A-Za-z0-9-]{2,24}\s*$/u, '').trim()
    : noYear;
  const cleaned = cleanGameTitle(raw);
  const cleanedNoYear = cleanGameTitle(noYear);
  const cleanedStripped = cleanGameTitle(noTrailingToken);
  const list = [raw, noYear, noTrailingToken, cleaned, cleanedNoYear, cleanedStripped];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const x = s.trim();
    if (x.length < 2 || seen.has(x.toLowerCase())) continue;
    seen.add(x.toLowerCase());
    out.push(x);
  }
  return out;
}

async function searchSteamGridRows(apiKey: string, term: string): Promise<SgSearchRow[]> {
  const searchResponse = await fetch(
    `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(term)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!searchResponse.ok) return [];
  const searchPayload = (await searchResponse.json()) as {
    data?: Array<{ id?: number; name?: string }>;
  };
  const rows: SgSearchRow[] = [];
  for (const item of searchPayload.data ?? []) {
    if (typeof item.id !== 'number') continue;
    rows.push({ id: item.id, name: (item.name ?? '').trim() || `game-${item.id}` });
  }
  return rows;
}

function pickBestGameId(originalTitle: string, rows: SgSearchRow[]): number | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0]!.id;
  const names = rows.map((r) => r.name);
  const idx = bestMatchIndex(originalTitle, names);
  return rows[idx >= 0 ? idx : 0].id;
}

async function resolveSteamGridCoverWithKey(apiKey: string, title: string): Promise<string | null> {
  const t = title.trim();
  if (!t) return null;

  for (const term of steamGridSearchQueryVariants(t)) {
    const rows = await searchSteamGridRows(apiKey, term);
    const gameId = pickBestGameId(t, rows);
    if (gameId == null) continue;
    const url = await fetchGridForGameId(apiKey, gameId);
    if (url) return url;
  }
  return null;
}

/** Para diagnóstico en Ajustes: qué intentó la API y si hubo URL. */
export async function probeSteamGridCover(title: string): Promise<{ coverUrl: string | null; attempts: string[] }> {
  const credentials = await getApiCredentials();
  const apiKey = credentials.steamGridDbApiKey?.trim();
  if (!apiKey || !title.trim()) {
    return { coverUrl: null, attempts: ['(sin API key o título)'] };
  }
  const attempts = steamGridSearchQueryVariants(title);
  try {
    const url = await resolveSteamGridCoverWithKey(apiKey, title);
    return { coverUrl: url, attempts };
  } catch {
    return { coverUrl: null, attempts: [...attempts, '(error de red)'] };
  }
}

export async function resolveCoverFromSteamGridDb(title: string): Promise<string | null> {
  const credentials = await getApiCredentials();
  const apiKey = credentials.steamGridDbApiKey?.trim();
  if (!apiKey || !title.trim()) {
    return null;
  }
  try {
    return await resolveSteamGridCoverWithKey(apiKey, title);
  } catch {
    return null;
  }
}
