import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const execAsync = vi.fn(async () => {});
  const runAsync = vi.fn(async () => {});
  const getAllAsync = vi.fn(async (query: string) => {
    if (query.includes('PRAGMA table_info(games)')) {
      return [{ name: 'id' }, { name: 'title' }, { name: 'platform' }];
    }
    if (query.includes('SELECT * FROM games')) {
      return [
        {
          id: 1,
          title: 'Metroid Prime',
          barcode: '045496391256',
          platform: 'GameCube',
          version: "Player's Choice",
          releaseYear: 2002,
          genre: 'Action Adventure',
          developer: 'Retro Studios',
          publisher: 'Nintendo',
          description: 'Sample',
          rating: 95,
          franchise: 'Metroid',
          coverUrl: null,
          headerImageUrl: null,
          coverLocalThumbUri: null,
          metadataStatus: 'resolved',
          metadataSource: 'igdb',
          lastError: null,
          favorite: 0,
          discOnly: 0,
          valueCents: null,
          valueCurrency: null,
          valueSource: null,
          valueUpdatedAt: null,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  });
  const getFirstAsync = vi.fn(async () => null);
  const writeAsStringAsync = vi.fn(async () => {});
  return { execAsync, runAsync, getAllAsync, getFirstAsync, writeAsStringAsync };
});

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn(async () => ({
    execAsync: mockState.execAsync,
    runAsync: mockState.runAsync,
    getAllAsync: mockState.getAllAsync,
    getFirstAsync: mockState.getFirstAsync,
  })),
}));

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/tmp/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: mockState.writeAsStringAsync,
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(async () => false),
  shareAsync: vi.fn(async () => {}),
}));

import { exportCatalogAsJson, initDatabase } from '../database/dbConfig';

describe('dbConfig integration-like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aplica migraciones e índice en initDatabase', async () => {
    await initDatabase();

    const executedQueries = (mockState.execAsync.mock.calls as unknown[]).map((call) => String((call as unknown[])[0]));
    expect(executedQueries.some((q) => q.includes('CREATE TABLE IF NOT EXISTS games'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('ALTER TABLE games ADD COLUMN barcode'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('idx_games_barcode_unique'))).toBe(true);
  });

  it('exporta payload JSON en ruta cache', async () => {
    const result = await exportCatalogAsJson();

    expect(result.shared).toBe(false);
    expect(result.fileUri).toContain('coverlens-catalog.json');
    expect(mockState.writeAsStringAsync).toHaveBeenCalledOnce();
  });
});
