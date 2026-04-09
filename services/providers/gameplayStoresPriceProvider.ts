/**
 * Precio «en tienda» desde gameplaystores.es (misma búsqueda JSON que portadas).
 * Sin API key; el listado incluye `price` tipo "7,95 €" (EUR, impuestos incluidos en tienda).
 */

import { findBestGameplayStoresProduct } from './gameplayStoresCoverProvider';

/**
 * Convierte el texto de precio del JSON de PrestaShop (EUR) a céntimos.
 */
export function parseGpsEuroPriceString(raw: string | undefined | null): { cents: number; currency: 'EUR' } | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  // "7,95 €" o "7.95 €"
  const m = s.match(/(\d+)[.,](\d{2})/);
  if (!m) return null;
  const euros = parseInt(m[1], 10);
  const centsPart = parseInt(m[2], 10);
  if (centsPart > 99) return null;
  const cents = euros * 100 + centsPart;
  if (cents <= 0) return null;
  return { cents, currency: 'EUR' };
}

export async function resolveRetailPriceFromGameplayStoresSearch(
  title: string,
  platformHint: string | null | undefined
): Promise<{ cents: number; currency: 'EUR' } | null> {
  const p = await findBestGameplayStoresProduct(title, platformHint);
  return parseGpsEuroPriceString(p?.price);
}
