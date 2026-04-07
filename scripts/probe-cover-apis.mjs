#!/usr/bin/env node
/**
 * Prueba en local cómo responden SteamGridDB y ScreenScraper (mismas URLs que la app).
 *
 * Flujo recomendado: primero valida resultados aquí; luego decide cambios en `coverPreferenceResolver`.
 *
 * 1) cp tests/coverProbe.secrets.env.example tests/coverProbe.secrets.env
 * 2) Rellena tests/coverProbe.secrets.env (.gitignore)
 * 3) Solo SteamGridDB: `npm run probe:covers:steam` (ignora ScreenScraper aunque esté en el fichero)
 *    o comenta las líneas SCREENSCRAPER_* en el .env y ejecuta `npm run probe:covers`
 * 4) Ambos: descomenta SS y `npm run probe:covers`
 *
 * export VAR=... en la terminal pisa valores del fichero.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SECRETS_FILE = join(__dirname, '../tests/coverProbe.secrets.env');

function loadSecretsFile() {
  if (!existsSync(SECRETS_FILE)) return;
  const raw = readFileSync(SECRETS_FILE, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadSecretsFile();

if (process.env.PROBE_SKIP_SCREENSCRAPER === '1') {
  delete process.env.SCREENSCRAPER_USER;
  delete process.env.SCREENSCRAPER_PASSWORD;
  delete process.env.SCREENSCRAPER_DEV_ID;
  delete process.env.SCREENSCRAPER_DEV_PASSWORD;
}

const TITLE = (process.env.PROBE_TITLE || 'Gears of War').trim();
const PLATFORM = (process.env.PROBE_PLATFORM || 'Xbox 360').trim();

const steamKey = process.env.STEAMGRIDDB_API_KEY?.trim();
const ssUser = process.env.SCREENSCRAPER_USER?.trim();
const ssPass = process.env.SCREENSCRAPER_PASSWORD?.trim();
const ssDevId = process.env.SCREENSCRAPER_DEV_ID?.trim();
const ssDevPass = process.env.SCREENSCRAPER_DEV_PASSWORD?.trim();

function log(section, ...args) {
  console.log(`\n── ${section} ──`);
  console.log(...args);
}

async function steamGridProbe() {
  if (!steamKey) {
    log('SteamGridDB', 'Omitido: define STEAMGRIDDB_API_KEY');
    return;
  }
  const variants = [TITLE, TITLE.replace(/\s*\([^)]*\)\s*$/u, '').trim()].filter(
    (v, i, a) => v.length >= 2 && a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i
  );

  for (const term of variants) {
    const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(term)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${steamKey}` } });
    const searchText = await searchRes.text();
    let data;
    try {
      data = JSON.parse(searchText);
    } catch {
      log('SteamGridDB', `HTTP ${searchRes.status} (respuesta no JSON)`, searchText.slice(0, 200));
      return;
    }
    const first = data?.data?.[0];
    log(
      'SteamGridDB',
      `Búsqueda «${term}» → HTTP ${searchRes.status}`,
      first ? `id=${first.id} name=${JSON.stringify(first.name)}` : 'sin resultados'
    );
    if (!first?.id) continue;

    for (const dim of ['342x482', '467x600', '600x900']) {
      const gridUrl = `https://www.steamgriddb.com/api/v2/grids/game/${first.id}?dimensions=${dim}`;
      const gridRes = await fetch(gridUrl, { headers: { Authorization: `Bearer ${steamKey}` } });
      const gridJson = await gridRes.json().catch(() => ({}));
      const url = gridJson?.data?.[0]?.url;
      log(`SteamGridDB (grid ${dim})`, `HTTP ${gridRes.status}`, url || JSON.stringify(gridJson).slice(0, 300));
      if (url) return;
    }
    return;
  }
}

function parseJeux(payload) {
  const raw = payload?.response?.jeux;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
}

function extractPlatform(game) {
  const sys = game?.systeme;
  if (!sys || typeof sys !== 'object') return '';
  return sys.nom || '';
}

function platformLooseMatch(gamePlatform, hint) {
  if (!hint) return true;
  const a = gamePlatform.toLowerCase();
  const b = hint.toLowerCase();
  return a.includes(b) || b.includes(a);
}

function extractCover(game) {
  const medias = game?.medias;
  if (!Array.isArray(medias)) return null;
  const box = medias.filter((m) => ['box-2D', 'mixrbv1', 'box-2D-back'].includes(m.type));
  const order = ['eu', 'ss', 'es', 'fr', 'wor', 'jp', 'uk', 'us'];
  const rank = (r) => {
    const i = order.indexOf((r || '').toLowerCase());
    return i === -1 ? 99 : i;
  };
  box.sort((x, y) => rank(x.region) - rank(y.region));
  return box[0]?.url || null;
}

async function screenScraperProbe() {
  if (process.env.PROBE_SKIP_SCREENSCRAPER === '1') {
    log('ScreenScraper', 'Omitido: PROBE_SKIP_SCREENSCRAPER=1 (prueba solo SteamGridDB).');
    return;
  }
  if (!ssUser || !ssPass) {
    log('ScreenScraper', 'Omitido: define SCREENSCRAPER_USER y SCREENSCRAPER_PASSWORD (o están comentados en el .env).');
    return;
  }
  const params = new URLSearchParams({
    output: 'json',
    softname: 'CoverLens',
    ssid: ssUser,
    sspassword: ssPass,
    recherche: TITLE,
  });
  if (ssDevId) params.set('devid', ssDevId);
  if (ssDevPass) params.set('devpassword', ssDevPass);

  const url = `https://www.screenscraper.fr/api2/jeuRecherche.php?${params.toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  log('ScreenScraper', `HTTP ${res.status}`, `bytes=${text.length}`);

  const lower = text.toLowerCase();
  if (
    lower.includes('identifiants développeur') ||
    lower.includes('identifiants developpeur') ||
    lower.includes('erreur de login')
  ) {
    log(
      'ScreenScraper (acción requerida)',
      'La API rechaza la petición: faltan o son incorrectos Dev ID / Dev password de aplicación.',
      'Regístralos en https://www.screenscraper.fr/devzone.php y añade SCREENSCRAPER_DEV_ID y SCREENSCRAPER_DEV_PASSWORD en tests/coverProbe.secrets.env (y en Ajustes de la app).',
      ssDevId ? '(Ya envías devid; revisa que coincida con el email de ScreenScraper.)' : '(Ahora mismo no se envía devid.)'
    );
    console.log(`Respuesta cruda: ${text.trim()}`);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    console.log(text.slice(0, 400));
    return;
  }

  const list = parseJeux(payload);
  log('ScreenScraper', `Resultados: ${list.length}`);

  const filtered = list.filter((g) => platformLooseMatch(extractPlatform(g), PLATFORM));
  const pool = filtered.length ? filtered : list;

  const preview = pool.slice(0, 8).map((g) => ({
    nom: g.nom || g.noms?.nom_eu || g.noms?.nom_us || '?',
    systeme: extractPlatform(g) || '?',
    cover: extractCover(g) ? '(sí)' : '(no)',
  }));
  console.log(JSON.stringify(preview, null, 2));

  const best = pool[0];
  if (best) {
    const coverUrl = extractCover(best);
    log(
      'ScreenScraper (primera del pool filtrado o lista completa)',
      `título: ${best.nom || best.noms?.nom_eu || '?'}`,
      `plataforma API: ${extractPlatform(best) || '?'}`,
      coverUrl ? `URL: ${coverUrl.slice(0, 120)}…` : 'sin box-2D / mixrbv1'
    );
  }
}

async function main() {
  console.log(`Probe: «${TITLE}» + plataforma hint «${PLATFORM}»`);
  await steamGridProbe();
  await screenScraperProbe();
  console.log('\nHecho.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
