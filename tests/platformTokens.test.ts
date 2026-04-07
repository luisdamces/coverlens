import { describe, expect, it } from 'vitest';
import {
  expandPlatformVariants,
  gameMatchesPlatformFilter,
  normalizePlatformFieldForStorage,
  uniqueCanonicalPlatforms,
} from '../services/utils/platformTokens';

describe('platformTokens', () => {
  it('expandPlatformVariants trocea listas y canoniza', () => {
    const v = expandPlatformVariants('Sony PlayStation 4, PC (Windows)');
    expect(v).toContain('PlayStation 4');
    expect(v).toContain('PC');
    expect(v.length).toBe(2);
  });

  it('gameMatchesPlatformFilter coincide por alias', () => {
    expect(gameMatchesPlatformFilter('PlayStation 4', 'PlayStation 4')).toBe(true);
    expect(gameMatchesPlatformFilter('Sony PlayStation 4', 'PlayStation 4')).toBe(true);
    expect(gameMatchesPlatformFilter('Sony PlayStation 4', 'Xbox One')).toBe(false);
  });

  it('uniqueCanonicalPlatforms deduplica', () => {
    const u = uniqueCanonicalPlatforms([
      { platform: 'Sony PlayStation 4' },
      { platform: 'PlayStation 4' },
      { platform: 'PC (Windows), Xbox One' },
    ]);
    expect(u).toContain('PlayStation 4');
    expect(u).toContain('PC');
    expect(u).toContain('Xbox One');
    expect(new Set(u).size).toBe(u.length);
  });

  it('normalizePlatformFieldForStorage unifica duplicados', () => {
    expect(normalizePlatformFieldForStorage('Sony PlayStation 4')).toBe('PlayStation 4');
  });
});
