import { describe, expect, it } from 'vitest';
import { pickGridCoverDisplayUri, remoteToThumbnailUrl } from '../services/storage/coverThumbUrls';

describe('remoteToThumbnailUrl', () => {
  it('reduce IGDB cover_big a t_cover_small (misma proporción que carátula)', () => {
    expect(
      remoteToThumbnailUrl('https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg')
    ).toBe('https://images.igdb.com/igdb/image/upload/t_cover_small/co1abc.jpg');
  });

  it('normaliza t_thumb IGDB a t_cover_small', () => {
    expect(
      remoteToThumbnailUrl('https://images.igdb.com/igdb/image/upload/t_thumb/co1abc.jpg')
    ).toBe('https://images.igdb.com/igdb/image/upload/t_cover_small/co1abc.jpg');
  });

  it('deja URLs sin patrón IGDB sin cambios', () => {
    const steamgrid = 'https://cdn2.steamgriddb.com/file/sgdb-c/grid/123.png';
    expect(remoteToThumbnailUrl(steamgrid)).toBe(steamgrid);
  });
});

describe('pickGridCoverDisplayUri', () => {
  it('prioriza coverUrl http sobre miniatura local', () => {
    expect(
      pickGridCoverDisplayUri('https://media.gameplaystores.es/x-large_default/a.jpg', 'file:///doc/covers/1.jpg')
    ).toBe('https://media.gameplaystores.es/x-large_default/a.jpg');
  });

  it('usa miniatura local si no hay URL remota', () => {
    expect(pickGridCoverDisplayUri(null, 'file:///doc/covers/1.jpg')).toBe('file:///doc/covers/1.jpg');
  });
});
