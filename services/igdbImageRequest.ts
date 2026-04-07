/**
 * IGDB CDN (images.igdb.com) suele exigir el header Client-ID en peticiones desde apps;
 * sin él, descarga y visor pueden responder 403.
 */
import { getApiCredentials } from './credentialsStore';

let cachedClientId: string | null | undefined;

export function invalidateIgdbImageCredentialsCache(): void {
  cachedClientId = undefined;
}

export function isIgdbImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('images.igdb.com') || u.includes('igdb.com/igdb/image');
}

async function loadClientId(): Promise<string> {
  if (cachedClientId !== undefined) return cachedClientId ?? '';
  const c = await getApiCredentials();
  cachedClientId = c.igdbClientId.trim();
  return cachedClientId;
}

/** Headers para expo-image / downloadAsync cuando la URL es del CDN de IGDB */
export async function getIgdbImageRequestHeaders(
  url: string | null | undefined
): Promise<Record<string, string> | undefined> {
  if (!isIgdbImageUrl(url)) return undefined;
  const id = await loadClientId();
  if (!id) return undefined;
  return { 'Client-ID': id };
}

/** Versión síncrona si ya se precargó el id (p.ej. desde la lista) */
export function getIgdbImageRequestHeadersSync(
  url: string | null | undefined,
  clientId: string | undefined
): Record<string, string> | undefined {
  if (!isIgdbImageUrl(url) || !clientId?.trim()) return undefined;
  return { 'Client-ID': clientId.trim() };
}
