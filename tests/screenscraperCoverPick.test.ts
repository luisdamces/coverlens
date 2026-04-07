import { describe, expect, it } from 'vitest';
import { type RawGame, pickBestGameForCover } from '../services/providers/screenScraperCoverPick';

describe('pickBestGameForCover', () => {
  it('filtra por plataforma cuando hay varias ediciones (PS4 vs PS5)', () => {
    const list: RawGame[] = [
      {
        nom: 'Cyberpunk 2077',
        systeme: { nom: 'Sony Playstation 4' },
        medias: [{ type: 'box-2D', url: 'https://ps4.jpg', region: 'eu' }],
      },
      {
        nom: 'Cyberpunk 2077',
        systeme: { nom: 'Sony Playstation 5' },
        medias: [{ type: 'box-2D', url: 'https://ps5.jpg', region: 'eu' }],
      },
    ];
    const best = pickBestGameForCover(list, 'Cyberpunk 2077', 'PlayStation 5');
    expect(best.medias?.[0]?.url).toBe('https://ps5.jpg');
  });
});
