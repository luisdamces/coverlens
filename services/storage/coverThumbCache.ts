/**
 * Persistencia de portadas para listado: miniatura en disco (IGDB t_thumb u origen sin cambiar).
 * La URL remota completa sigue en coverUrl para detalle y futuras políticas de caché.
 *
 * Cola serial evita saturar red/CPU al reintentar metadatos en masa.
 */
import * as FileSystem from 'expo-file-system/legacy';

import { getGameById, updateGameLocalThumbUri } from '../../database/dbConfig';
import { getIgdbImageRequestHeaders } from '../igdbImageRequest';
import { remoteToThumbnailUrl } from './coverThumbUrls';

const COVERS_DIR = 'covers';

export { remoteToThumbnailUrl } from './coverThumbUrls';

async function coversDirectory(): Promise<string> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('documentDirectory no disponible');
  const dir = `${root}${COVERS_DIR}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export async function scheduleCoverThumbCache(gameId: number, remoteUrl: string | null): Promise<void> {
  if (!remoteUrl?.startsWith('http')) {
    const row = await getGameById(gameId);
    if (row?.coverLocalThumbUri) {
      try {
        await FileSystem.deleteAsync(row.coverLocalThumbUri, { idempotent: true });
      } catch {
        /* ignore */
      }
      await updateGameLocalThumbUri(gameId, null);
    }
    return;
  }

  const dir = await coversDirectory();
  const dest = `${dir}${gameId}.jpg`;
  const thumbUrl = remoteToThumbnailUrl(remoteUrl);

  try {
    const headers = await getIgdbImageRequestHeaders(thumbUrl);
    const { uri, status } = await FileSystem.downloadAsync(thumbUrl, dest, headers ? { headers } : undefined);
    if (status >= 200 && status < 300) {
      await updateGameLocalThumbUri(gameId, uri);
    }
  } catch {
    /* red o URL inválida: el listado seguirá usando coverUrl remoto */
  }
}

let chain: Promise<void> = Promise.resolve();

export function enqueueCoverThumbCache(gameId: number, remoteUrl: string | null): void {
  chain = chain
    .then(() => scheduleCoverThumbCache(gameId, remoteUrl))
    .catch(() => {});
}
