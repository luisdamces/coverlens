import { describe, expect, it } from 'vitest';
import { buildEbaySearchQueries, ebayUsesSandbox } from '../services/ebayPriceProvider';

describe('ebayUsesSandbox', () => {
  it('detecta keyset sandbox por -SBX- en Client ID', () => {
    expect(ebayUsesSandbox('LuisUtri-coverlen-SBX-6524781bf-0f96bf79')).toBe(true);
    expect(ebayUsesSandbox('sbX-test')).toBe(false);
  });

  it('producción sin SBX', () => {
    expect(ebayUsesSandbox('LuisUtri-coverlen-PRD-34c4892fb')).toBe(false);
  });
});

describe('buildEbaySearchQueries', () => {
  it('incluye título+plataforma y variantes limpias', () => {
    const q = buildEbaySearchQueries("Marvel's Spider-Man", 'PlayStation 4');
    expect(q.length).toBeGreaterThan(2);
    expect(q.some((x) => x.toLowerCase().includes('playstation 4'))).toBe(true);
    expect(q[0]).toContain('Spider');
  });

  it('no duplica entradas idénticas', () => {
    const q = buildEbaySearchQueries('Halo', 'Xbox');
    const lower = q.map((s) => s.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});
