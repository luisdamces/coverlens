import { describe, expect, it } from 'vitest';
import type { GameRecord } from '../database/dbConfig';
import { filterAndSortGames } from '../services/catalogDisplay';

function base(over: Partial<GameRecord> & Pick<GameRecord, 'id' | 'title' | 'platform'>): GameRecord {
  return {
    barcode: null,
    version: null,
    releaseYear: null,
    genre: null,
    developer: null,
    publisher: null,
    description: null,
    rating: null,
    franchise: null,
    coverUrl: null,
    headerImageUrl: null,
    coverLocalThumbUri: null,
    metadataStatus: 'resolved',
    metadataSource: null,
    lastError: null,
    favorite: 0,
    discOnly: 0,
    valueCents: null,
    valueCurrency: null,
    valueSource: null,
    valueUpdatedAt: null,
    createdAt: '2020-01-01',
    ...over,
  };
}

describe('filterAndSortGames', () => {
  const games: GameRecord[] = [
    base({ id: 1, title: 'Zelda', platform: 'Switch', metadataStatus: 'pending', favorite: 1, valueCents: 1000 }),
    base({ id: 2, title: 'Mario', platform: 'NES', metadataStatus: 'resolved', discOnly: 1, valueCents: 5000 }),
    base({ id: 3, title: 'Metroid', platform: 'SNES', metadataStatus: 'error', releaseYear: 1994 }),
  ];

  it('filtra por texto en título', () => {
    const out = filterAndSortGames(
      games,
      { search: 'met', platform: null, onlyFavorite: false, onlyDiscOnly: false },
      'title_asc'
    );
    expect(out.map((x) => x.title)).toEqual(['Metroid']);
  });

  it('filtra por plataforma', () => {
    const out = filterAndSortGames(
      games,
      { search: '', platform: 'NES', onlyFavorite: false, onlyDiscOnly: false },
      'title_asc'
    );
    expect(out.map((x) => x.title)).toEqual(['Mario']);
  });

  it('filtra favoritos y ordena por valor', () => {
    const out = filterAndSortGames(
      games,
      { search: '', platform: null, onlyFavorite: true, onlyDiscOnly: false },
      'value_desc'
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe('Zelda');
  });

  it('filtra solo disco', () => {
    const out = filterAndSortGames(
      games,
      { search: '', platform: null, onlyFavorite: false, onlyDiscOnly: true },
      'added_desc'
    );
    expect(out.map((x) => x.id)).toEqual([2]);
  });
});
