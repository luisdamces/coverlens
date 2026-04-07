import { describe, expect, it } from 'vitest';
import { canonicalizePlatform } from '../services/utils/platformUtils';

describe('platformUtils', () => {
  it('normaliza alias comunes a nombres consistentes', () => {
    expect(canonicalizePlatform('Nintendo GameCube')).toBe('GameCube');
    expect(canonicalizePlatform('PlayStation 4')).toBe('PlayStation 4');
    expect(canonicalizePlatform('Microsoft Windows')).toBe('PC');
  });

  it('mantiene el valor original si no reconoce plataforma', () => {
    expect(canonicalizePlatform('Plataforma Custom XYZ')).toBe('Plataforma Custom XYZ');
  });
});
