import { fetchWithTimeout } from './utils/networkUtils';
import { cleanGameTitle } from './utils/titleUtils';

/** Timeout algo mayor en sandbox (suele ir más lento). */
const EBAY_TIMEOUT_MS_PROD = 20000;
const EBAY_TIMEOUT_MS_SANDBOX = 35000;

const OAUTH_SCOPE = 'https://api.ebay.com/oauth/api_scope';

/**
 * Keysets sandbox en developer.ebay.com incluyen `-SBX-` en el App ID (Client ID).
 * @see https://developer.ebay.com/api-docs/static/oauth-client-credentials-grant.html
 */
export function ebayUsesSandbox(clientId: string): boolean {
  return clientId.toUpperCase().includes('-SBX-');
}

function resolveEbayHosts(clientId: string): {
  oauthTokenUrl: string;
  browseSearchUrl: string;
  sandbox: boolean;
  timeoutMs: number;
} {
  const sandbox = ebayUsesSandbox(clientId);
  if (sandbox) {
    return {
      oauthTokenUrl: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      browseSearchUrl: 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search',
      sandbox: true,
      timeoutMs: EBAY_TIMEOUT_MS_SANDBOX,
    };
  }
  return {
    oauthTokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    browseSearchUrl: 'https://api.ebay.com/buy/browse/v1/item_summary/search',
    sandbox: false,
    timeoutMs: EBAY_TIMEOUT_MS_PROD,
  };
}

function oauthBasicHeader(clientId: string, clientSecret: string): string {
  const raw = `${clientId.trim()}:${clientSecret.trim()}`;
  if (typeof globalThis.btoa === 'function') {
    return `Basic ${globalThis.btoa(raw)}`;
  }
  throw new Error('Base64 no disponible en este entorno');
}

/**
 * Token de aplicación (client credentials) para Buy Browse API.
 * El host (producción vs sandbox) se deduce del Client ID.
 */
export async function fetchEbayApplicationToken(
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  if (!clientId.trim() || !clientSecret.trim()) return null;
  const { oauthTokenUrl, timeoutMs } = resolveEbayHosts(clientId);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: OAUTH_SCOPE,
  });
  const res = await fetchWithTimeout(
    oauthTokenUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: oauthBasicHeader(clientId, clientSecret),
      },
      body: body.toString(),
    },
    timeoutMs
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

type EbayItemSummary = { price?: { value?: string; currency?: string } };

/**
 * Variantes de consulta para Browse API (sandbox a menudo vacío con frases largas).
 * Exportado para tests y diagnóstico.
 */
export function buildEbaySearchQueries(title: string, platform: string): string[] {
  const t = title.trim();
  const p = platform.trim();
  const cleaned = cleanGameTitle(t);
  const out: string[] = [];
  const push = (s: string) => {
    const x = s.replace(/\s+/g, ' ').trim();
    if (x.length < 2) return;
    if (!out.some((e) => e.toLowerCase() === x.toLowerCase())) out.push(x);
  };
  if (t && p) {
    push(`${t} ${p}`);
    push(`${t} ${p} game`);
  }
  if (cleaned && p) {
    push(`${cleaned} ${p}`);
    push(`${cleaned} ${p} game`);
  }
  if (t) {
    push(t);
    push(`${t} game`);
    push(`${t} video game`);
  }
  if (cleaned && cleaned.length >= 3) {
    push(`${cleaned} game`);
  }
  return out;
}

function medianFromSummaries(items: EbayItemSummary[]): { cents: number; currency: string } | null {
  const centsList: { cents: number; currency: string }[] = [];
  for (const it of items) {
    const v = it.price?.value;
    const cur = it.price?.currency;
    if (typeof v !== 'string' || !cur) continue;
    const major = parseFloat(v);
    if (!Number.isFinite(major) || major <= 0) continue;
    centsList.push({ cents: Math.round(major * 100), currency: cur });
  }
  if (centsList.length === 0) return null;
  centsList.sort((a, b) => a.cents - b.cents);
  const mid = centsList[Math.floor(centsList.length / 2)]!;
  return { cents: mid.cents, currency: mid.currency };
}

async function browseSearchOnce(
  accessToken: string,
  marketplaceId: string,
  query: string,
  clientIdForEnvironment: string
): Promise<{ itemSummaries?: EbayItemSummary[] } | null> {
  const { browseSearchUrl, timeoutMs } = resolveEbayHosts(clientIdForEnvironment);
  const url = new URL(browseSearchUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '40');

  const res = await fetchWithTimeout(
    url.toString(),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-EBAY-C-MARKETPLACE-ID': marketplaceId.trim() || 'EBAY_ES',
      },
    },
    timeoutMs
  );
  if (!res.ok) return null;
  return (await res.json()) as { itemSummaries?: EbayItemSummary[] };
}

export type EbayMedianResult = { cents: number; currency: string; usedQuery: string };

/**
 * Mediana de precios de anuncios activos. Prueba varias consultas hasta encontrar items con precio.
 */
export async function medianActiveListingPrice(
  accessToken: string,
  marketplaceId: string,
  title: string,
  platform: string,
  clientIdForEnvironment: string
): Promise<EbayMedianResult | null> {
  const queries = buildEbaySearchQueries(title, platform);
  const maxTries = 6;
  for (let i = 0; i < Math.min(queries.length, maxTries); i++) {
    const q = queries[i]!;
    const data = await browseSearchOnce(accessToken, marketplaceId, q, clientIdForEnvironment);
    const items = data?.itemSummaries ?? [];
    const med = medianFromSummaries(items);
    if (med) return { ...med, usedQuery: q };
  }
  return null;
}
