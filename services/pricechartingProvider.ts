import { fetchWithTimeout } from './utils/networkUtils';

const BASE = 'https://www.pricecharting.com';

export type PcCondition = 'loose' | 'cib' | 'new';

export type PriceChartingQuote = {
  looseCents: number | null;
  cibCents: number | null;
  newCents: number | null;
  productName: string | null;
  consoleName: string | null;
};

function readPriceCents(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * PriceCharting Prices API (suscripción Pro + token en parámetro t).
 * Precios en centavos de USD.
 */
export async function fetchPriceChartingProduct(
  token: string,
  opts: { upc?: string | null; query?: string | null }
): Promise<PriceChartingQuote | null> {
  const t = token.trim();
  if (!t) return null;
  const params = new URLSearchParams({ t });
  const upc = opts.upc?.trim();
  const q = opts.query?.trim();
  if (upc) params.set('upc', upc);
  else if (q) params.set('q', q);
  else return null;

  const url = `${BASE}/api/product?${params.toString()}`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 16000);
  const data = (await res.json()) as Record<string, unknown>;
  if (data.status !== 'success') return null;

  return {
    looseCents: readPriceCents(data['loose-price']),
    cibCents: readPriceCents(data['cib-price']),
    newCents: readPriceCents(data['new-price']),
    productName: typeof data['product-name'] === 'string' ? data['product-name'] : null,
    consoleName: typeof data['console-name'] === 'string' ? data['console-name'] : null,
  };
}

export function pickPriceChartingCents(
  quote: PriceChartingQuote,
  discOnly: boolean
): { cents: number; condition: PcCondition } | null {
  if (discOnly && quote.looseCents != null) {
    return { cents: quote.looseCents, condition: 'loose' };
  }
  if (!discOnly && quote.cibCents != null) {
    return { cents: quote.cibCents, condition: 'cib' };
  }
  if (quote.looseCents != null) return { cents: quote.looseCents, condition: 'loose' };
  if (quote.cibCents != null) return { cents: quote.cibCents, condition: 'cib' };
  if (quote.newCents != null) return { cents: quote.newCents, condition: 'new' };
  return null;
}
