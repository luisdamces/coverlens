import { describe, expect, it } from 'vitest';
import {
  deriveMetadataStatusFromGameFields,
  finalizeMetadataResult,
} from '../services/utils/metadataCompleteness';

describe('deriveMetadataStatusFromGameFields', () => {
  it('resolved con portada, plataforma y al menos un dato de ficha', () => {
    expect(
      deriveMetadataStatusFromGameFields({
        title: 'Zelda',
        platform: 'Switch',
        coverUrl: 'https://images.igdb.com/x.jpg',
        genre: 'Adventure',
      })
    ).toBe('resolved');
  });

  it('partial sin portada http aunque haya género', () => {
    expect(
      deriveMetadataStatusFromGameFields({
        title: 'Zelda',
        platform: 'Switch',
        coverUrl: null,
        genre: 'Adventure',
      })
    ).toBe('partial');
  });

  it('partial con portada pero sin ningún dato de ficha extra', () => {
    expect(
      deriveMetadataStatusFromGameFields({
        title: 'Zelda',
        platform: 'Switch',
        coverUrl: 'https://x/y.jpg',
      })
    ).toBe('partial');
  });
});

describe('finalizeMetadataResult', () => {
  it('no toca errores del proveedor', () => {
    const r = finalizeMetadataResult({
      title: 'x',
      platform: 'y',
      status: 'error',
      source: 'igdb',
      error: 'fail',
    });
    expect(r.status).toBe('error');
  });
});
