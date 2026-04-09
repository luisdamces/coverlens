import { describe, expect, it } from 'vitest';
import { parseGpsEuroPriceString } from '../services/providers/gameplayStoresPriceProvider';

describe('parseGpsEuroPriceString', () => {
  it('parsea formato PrestaShop con NBSP y símbolo €', () => {
    const r = parseGpsEuroPriceString('7,95\u00a0\u20ac');
    expect(r).toEqual({ cents: 795, currency: 'EUR' });
  });

  it('parsea precio con espacio antes del €', () => {
    expect(parseGpsEuroPriceString('12,00 €')).toEqual({ cents: 1200, currency: 'EUR' });
  });

  it('rechaza vacío o sin decimales reconocibles', () => {
    expect(parseGpsEuroPriceString('')).toBeNull();
    expect(parseGpsEuroPriceString(null)).toBeNull();
    expect(parseGpsEuroPriceString('sin precio')).toBeNull();
  });
});
