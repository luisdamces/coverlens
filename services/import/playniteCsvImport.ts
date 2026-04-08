import type { NewGameInput } from '../../database/dbConfig';
import { deriveMetadataStatusFromGameFields } from '../utils/metadataCompleteness';
import { detectCsvDelimiter, parseDelimitedRows } from './csvParse';
import { normalizePlatformFieldForStorage } from '../utils/platformTokens';
import { stripHtml } from './catalogImportStrings';

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

type ColKey =
  | 'title'
  | 'platform'
  | 'description'
  | 'developer'
  | 'publisher'
  | 'genre'
  | 'favorite'
  | 'hidden'
  | 'releaseDate'
  | 'franchise'
  | 'communityScore'
  | 'criticScore'
  | 'userScore'
  | 'version'
  | 'gameId';

function columnKey(raw: string): ColKey | null {
  const n = normalizeHeader(raw);

  if (n === 'nombre' || n === 'name') return 'title';
  if (n === 'plataformas' || n === 'platforms' || n === 'platform') return 'platform';
  if (n === 'descripcion' || n === 'description') return 'description';
  if (n === 'desarrolladores' || n === 'developers') return 'developer';
  if (n === 'editores' || n === 'publishers') return 'publisher';
  if (n === 'generos' || n === 'genres') return 'genre';
  if (n === 'favorito' || n === 'favorite') return 'favorite';
  if (n === 'oculto' || n === 'hidden') return 'hidden';
  if (n.includes('fecha de lanzamiento') || n === 'release date' || n === 'released') return 'releaseDate';
  if (n === 'serie' || n === 'series') return 'franchise';
  if (n.includes('valoracion de la comunidad') || n.includes('community score') || n === 'communityscore')
    return 'communityScore';
  if (n.includes('valoracion de la critica') || n.includes('critic score') || n === 'criticscore')
    return 'criticScore';
  if (n.includes('puntuacion del usuario') || n.includes('user score') || n === 'userscore')
    return 'userScore';
  if (n === 'version') return 'version';
  if (n === 'id del juego' || n === 'game id' || n === 'gameid') return 'gameId';

  return null;
}

function buildColumnMap(headers: string[]): Partial<Record<ColKey, number>> {
  const map: Partial<Record<ColKey, number>> = {};
  headers.forEach((h, i) => {
    const k = columnKey(h);
    if (k != null && map[k] === undefined) {
      map[k] = i;
    }
  });
  return map;
}

function cell(row: string[], idx: number | undefined): string {
  if (idx == null || idx < 0) return '';
  return row[idx] ?? '';
}

function parseBool(raw: string): boolean | null {
  const x = raw.trim().toLowerCase();
  if (x === 'true' || x === '1' || x === 'si' || x === 'sí' || x === 'verdadero' || x === 'yes') return true;
  if (x === 'false' || x === '0' || x === 'no' || x === 'falso' || x === '') return false;
  return null;
}

function parseReleaseYear(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) {
    const y = parseInt(m[3]!, 10);
    if (y >= 1950 && y <= 2100) return y;
  }
  return null;
}

function parseOptionalScore(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseFloat(t.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n >= 0 && n <= 100) return n;
  return null;
}

/** Listas Playnite en una celda: "A;B;C" → "A, B" */
function joinListCell(raw: string): string {
  const parts = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.join(', ');
}

export function parsePlayniteLibraryExporterCsv(text: string): { rows: NewGameInput[]; notes: string[] } {
  const notes: string[] = [];
  let s = text;
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1);
  }

  const firstNl = s.search(/\r?\n/);
  const firstLine = (firstNl >= 0 ? s.slice(0, firstNl) : s).replace(/\r$/, '');
  if (!firstLine.trim()) {
    return { rows: [], notes: ['El archivo CSV está vacío.'] };
  }

  const delim = detectCsvDelimiter(firstLine);
  const allRows = parseDelimitedRows(s, delim);
  if (allRows.length < 2) {
    return { rows: [], notes: ['No hay filas de datos en el CSV (solo cabecera o archivo incompleto).'] };
  }

  const headerRow = allRows[0]!;
  const col = buildColumnMap(headerRow);

  if (col.title === undefined) {
    return {
      rows: [],
      notes: ['No se encontró la columna de título (Nombre / Name).'],
    };
  }
  if (col.platform === undefined) {
    return {
      rows: [],
      notes: ['No se encontró la columna de plataforma (Plataformas / Platforms).'],
    };
  }

  const expectedCols = headerRow.length;
  let hiddenSkipped = 0;
  let invalidRows = 0;
  const rows: NewGameInput[] = [];

  for (let r = 1; r < allRows.length; r++) {
    const raw = allRows[r]!;
    const line = raw.length > expectedCols ? raw.slice(0, expectedCols) : [...raw];
    while (line.length < expectedCols) {
      line.push('');
    }

    const hiddenRaw = cell(line, col.hidden);
    const hidden = parseBool(hiddenRaw);
    if (hidden === true) {
      hiddenSkipped++;
      continue;
    }

    const title = cell(line, col.title).trim();
    const platformRaw = cell(line, col.platform).trim();
    const platformJoined = joinListCell(platformRaw) || platformRaw;
    const platform = normalizePlatformFieldForStorage(platformJoined);

    if (!title || !platform) {
      invalidRows++;
      continue;
    }

    const descriptionRaw = cell(line, col.description);
    const description = descriptionRaw ? stripHtml(descriptionRaw) : null;

    const userScore = parseOptionalScore(cell(line, col.userScore));
    const criticScore = parseOptionalScore(cell(line, col.criticScore));
    const communityScore = parseOptionalScore(cell(line, col.communityScore));
    let rating: number | null = null;
    if (userScore != null) rating = userScore;
    else if (criticScore != null) rating = criticScore;
    else if (communityScore != null) rating = communityScore;

    const genreRaw = cell(line, col.genre);
    const genre = genreRaw ? joinListCell(genreRaw) || genreRaw.trim() : null;

    const gameId = cell(line, col.gameId).trim();
    const barcode =
      gameId && /^\d{8,14}$/.test(gameId.replace(/\s/g, '')) ? gameId.replace(/\s/g, '') : null;

    const fav = parseBool(cell(line, col.favorite));
    const favorite: 0 | 1 = fav === true ? 1 : 0;

    const row: NewGameInput = {
      title,
      barcode,
      platform,
      version: cell(line, col.version).trim() || null,
      releaseYear: parseReleaseYear(cell(line, col.releaseDate)),
      genre,
      developer: cell(line, col.developer).trim() || null,
      publisher: cell(line, col.publisher).trim() || null,
      description,
      rating,
      franchise: cell(line, col.franchise).trim() || null,
      coverUrl: null,
      headerImageUrl: null,
      metadataStatus: 'pending',
      metadataSource: 'import:playnite-csv',
      lastError: null,
      favorite,
      discOnly: 0,
    };
    rows.push({ ...row, metadataStatus: deriveMetadataStatusFromGameFields(row) });
  }

  if (hiddenSkipped > 0) {
    notes.push(`Se omitieron ${hiddenSkipped} fila(s) marcadas como ocultas (Oculto).`);
  }
  if (invalidRows > 0) {
    notes.push(`Se saltaron ${invalidRows} fila(s) sin título o sin plataforma.`);
  }
  notes.push(
    'CSV Playnite: las portadas no suelen venir en el export; usa «Reintentar metadatos» en CoverLens para carátulas.'
  );

  return { rows, notes };
}
