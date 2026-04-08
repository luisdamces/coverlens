/**
 * MEJORA PENDIENTE — ScreenScraper Dev ID para PokedexGamer
 *
 * Playnite lleva su propio devid/devpassword hardcodeado en el plugin de ScreenScraper.
 * Los usuarios de Playnite solo ponen usuario/password porque el Dev ID de la app
 * ya viene dentro del código.
 *
 * Para replicar esto en PokedexGamer:
 *   1. Registrar la app en https://www.screenscraper.fr/devzone.php
 *      (nombre: PokedexGamer, descripción: app personal de catálogo de videojuegos)
 *   2. Recibir devid + devpassword por email
 *   3. Hardcodearlos aquí en buildBaseParams() como hace Playnite
 *   4. Eliminar los campos Dev ID/Dev Password de la pantalla Ajustes
 *   5. Resultado: los usuarios solo pondrán usuario + password, igual que en Playnite
 *
 * Mientras tanto, el proveedor principal es IGDB (también el principal de Playnite).
 */
import { getApiCredentials } from '../credentialsStore';
import { fetchWithTimeout } from '../utils/networkUtils';
import { cleanGameTitle } from '../utils/titleUtils';
import {
  type RawGame,
  extractPlatform,
  extractTitle,
  pickBestGameForCover,
} from './screenScraperCoverPick';
import { MetadataResult, ResolveInput } from './types';

export { pickBestGameForCover } from './screenScraperCoverPick';

function buildBaseParams(credentials: Awaited<ReturnType<typeof getApiCredentials>>) {
  const params: Record<string, string> = {
    output: 'json',
    softname: 'CoverLens',
    ssid: credentials.screenScraperUsername,
    sspassword: credentials.screenScraperPassword,
  };
  // Dev ID y Dev Password son opcionales; si no están, la API puede dar rate limits más bajos
  // pero seguirá funcionando para uso personal
  if (credentials.screenScraperDevId) {
    params.devid = credentials.screenScraperDevId;
  }
  if (credentials.screenScraperDevPassword) {
    params.devpassword = credentials.screenScraperDevPassword;
  }
  return new URLSearchParams(params);
}

function extractYear(game: RawGame): number | null {
  const dates = game.dates;
  if (!dates) return null;
  const raw = dates.date_eu ?? dates.date_us ?? dates.date_jp ?? '';
  const year = Number.parseInt(raw.slice(0, 4), 10);
  return Number.isFinite(year) && year > 1970 ? year : null;
}

function extractGenre(game: RawGame): string | null {
  const g = game.genres;
  if (!g) return null;
  if (Array.isArray(g)) {
    const first = g[0];
    return first?.noms?.[0]?.text ?? first?.nom ?? null;
  }
  return (g as { genre_1?: string }).genre_1 ?? null;
}

/** EU / ES / WOR antes que US para carátulas físicas más cercanas a España. */
const COVER_REGION_ORDER = ['eu', 'ss', 'es', 'fr', 'wor', 'jp', 'uk', 'us'];

function regionRank(region: string | undefined): number {
  const r = (region ?? '').toLowerCase().trim();
  const i = COVER_REGION_ORDER.indexOf(r);
  return i === -1 ? 20 : i;
}

function boxTypeRank(type: string | undefined): number {
  if (type === 'box-2D') return 0;
  if (type === 'mixrbv1') return 1;
  if (type === 'box-2D-back') return 2;
  return 3;
}

function extractCover(game: RawGame): string | null {
  if (!Array.isArray(game.medias)) return null;
  const candidates = game.medias.filter(
    (m) => m.type === 'box-2D' || m.type === 'box-2D-back' || m.type === 'mixrbv1'
  );
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const rr = regionRank(a.region) - regionRank(b.region);
    if (rr !== 0) return rr;
    return boxTypeRank(a.type) - boxTypeRank(b.type);
  });
  return sorted[0]?.url ?? null;
}

function parseJeuxList(payload: { response?: { jeux?: unknown[] | Record<string, unknown> } }): RawGame[] {
  const listRaw = payload?.response?.jeux;
  if (Array.isArray(listRaw)) return listRaw as RawGame[];
  if (listRaw && typeof listRaw === 'object') return Object.values(listRaw) as RawGame[];
  return [];
}

async function fetchJeuxRechercheList(
  searchTerm: string,
  credentials: Awaited<ReturnType<typeof getApiCredentials>>
): Promise<{ list: RawGame[]; httpStatus: number }> {
  const params = buildBaseParams(credentials);
  const url = `https://www.screenscraper.fr/api2/jeuRecherche.php?${params.toString()}&recherche=${encodeURIComponent(searchTerm)}`;
  const response = await fetchWithTimeout(url, undefined, 12000);
  const httpStatus = response.status;
  if (!response.ok) return { list: [], httpStatus };
  try {
    const body = await response.text();
    const payload = JSON.parse(body) as { response?: { jeux?: unknown[] | Record<string, unknown> } };
    return { list: parseJeuxList(payload), httpStatus };
  } catch {
    return { list: [], httpStatus };
  }
}

export type ScreenScraperCoverProbe = {
  coverUrl: string | null;
  pickedTitle: string;
  pickedPlatform: string;
  candidates: number;
};

/** Diagnóstico: qué devolvería ScreenScraper con tus credenciales (solo en el dispositivo). */
export async function probeScreenScraperCover(
  title: string,
  platformHint: string | null
): Promise<ScreenScraperCoverProbe> {
  const empty: ScreenScraperCoverProbe = {
    coverUrl: null,
    pickedTitle: '',
    pickedPlatform: '',
    candidates: 0,
  };
  const credentials = await getApiCredentials();
  if (!credentials.screenScraperUsername || !credentials.screenScraperPassword || !title.trim()) {
    return empty;
  }
  const cleanedQuery = cleanGameTitle(title);
  const searchTerm = cleanedQuery || title.trim();
  try {
    const { list } = await fetchJeuxRechercheList(searchTerm, credentials);
    if (list.length === 0) return { ...empty, candidates: 0 };
    const best = pickBestGameForCover(list, title, platformHint);
    return {
      coverUrl: extractCover(best),
      pickedTitle: extractTitle(best, ''),
      pickedPlatform: extractPlatform(best),
      candidates: list.length,
    };
  } catch {
    return empty;
  }
}

/**
 * Solo portada: búsqueda por título + filtro por plataforma del juego (caja física correcta).
 */
export async function resolveCoverFromScreenScraperSearch(
  title: string,
  platformHint?: string | null
): Promise<string | null> {
  const credentials = await getApiCredentials();
  if (!credentials.screenScraperUsername || !credentials.screenScraperPassword || !title.trim()) {
    return null;
  }
  const cleanedQuery = cleanGameTitle(title);
  const searchTerm = cleanedQuery || title.trim();
  try {
    const { list } = await fetchJeuxRechercheList(searchTerm, credentials);
    if (list.length === 0) return null;
    const best = pickBestGameForCover(list, title, platformHint);
    return extractCover(best);
  } catch {
    return null;
  }
}

function normalizeGame(game: RawGame, fallbackTitle: string): MetadataResult {
  const title = extractTitle(game, fallbackTitle);
  const platform = extractPlatform(game);
  const isPartial = platform === 'Plataforma desconocida';
  return {
    title,
    platform,
    version: null,
    releaseYear: extractYear(game),
    genre: extractGenre(game),
    developer: game.developpeur?.text ?? game.editeur?.text ?? null,
    coverUrl: extractCover(game),
    status: isPartial ? 'partial' : 'resolved',
    source: 'screenscraper',
  };
}

/**
 * Estrategia de búsqueda en 3 pasos (inspirada en Playnite):
 * 1. Búsqueda directa por barcode  → jeuInfos.php
 * 2. Si falla y hay titleHint      → jeuRecherche.php con título limpio
 *    → de los resultados, elige el que mejor puntúa (scoreMatch)
 * 3. Si no hay barcode pero sí titleHint → solo búsqueda por título
 *
 * Dev ID y Dev Password son opcionales. Sin ellos funciona pero con rate limits más bajos.
 */
export async function resolveFromScreenScraper(input: ResolveInput): Promise<MetadataResult | null> {
  const credentials = await getApiCredentials();

  // Solo requerimos usuario y password; devId/devPassword son opcionales
  if (!credentials.screenScraperUsername || !credentials.screenScraperPassword) {
    return {
      title: input.titleHint ?? (input.barcode ? `Juego ${input.barcode}` : 'Juego desconocido'),
      platform: 'Plataforma desconocida',
      status: 'error',
      source: 'screenscraper',
      error: 'missing_credentials',
    };
  }

  const params = buildBaseParams(credentials);
  const fallbackTitle = input.titleHint ?? (input.barcode ? `Juego ${input.barcode}` : 'Juego desconocido');
  let had400 = false;
  let had200 = false;

  // PASO 1: búsqueda directa por barcode
  if (input.barcode) {
    try {
      const url = `https://www.screenscraper.fr/api2/jeuInfos.php?${params.toString()}&barcode=${encodeURIComponent(input.barcode)}`;
      const response = await fetchWithTimeout(url, undefined, 10000);
      const body = await response.text();

      if (response.status === 400) {
        had400 = true;
      } else if (response.ok) {
        had200 = true;
        const payload = JSON.parse(body) as { response?: { jeu?: RawGame } };
        const game = payload?.response?.jeu;
        if (game) return normalizeGame(game, fallbackTitle);
      }
    } catch {
      // continúa al paso 2
    }
  }

  // PASO 2/3: búsqueda textual por título limpio
  const searchQuery = input.titleHint ?? input.barcode;
  if (searchQuery) {
    const cleanedQuery = cleanGameTitle(searchQuery);
    const searchTerm = cleanedQuery || searchQuery;

    try {
      const { list, httpStatus } = await fetchJeuxRechercheList(searchTerm, credentials);
      if (httpStatus === 400) had400 = true;
      if (httpStatus >= 200 && httpStatus < 300) had200 = true;
      if (list.length > 0) {
        const best = pickBestGameForCover(list, searchQuery, input.platformHint);
        const result = normalizeGame(best, fallbackTitle);
        const topTitle = extractTitle(best, '');
        if (cleanGameTitle(topTitle) !== cleanGameTitle(searchQuery)) {
          return { ...result, status: result.status === 'resolved' ? 'partial' : result.status };
        }
        return result;
      }
    } catch {
      // continúa
    }
  }

  return {
    title: fallbackTitle,
    platform: 'Plataforma desconocida',
    status: 'error',
    source: 'screenscraper',
    error: had400 && !had200 ? 'invalid_params' : had200 ? 'not_found' : 'request_failed',
  };
}
