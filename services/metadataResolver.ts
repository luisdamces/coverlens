import { loadCoverSourcePreferences } from './coverSourcePreferences';
import { resolvePreferredCoverWithSource } from './coverPreferenceResolver';
import { resolveFromIgdb } from './providers/igdbProvider';
import { resolveFromScreenScraper } from './providers/screenScraperProvider';
import { finalizeMetadataResult } from './utils/metadataCompleteness';
import { barcodeToTitle } from './utils/barcodeToTitle';
import { MetadataResult, ResolveInput } from './providers/types';
import type { CoverSourcePreferences } from './coverSourcePreferences';

function headerPatchFromProviderCover(coverUrl: string | null | undefined): Pick<MetadataResult, 'headerImageUrl'> | object {
  const u = coverUrl?.trim() ?? '';
  if (/^https?:\/\//i.test(u)) return { headerImageUrl: u };
  return {};
}

function omitImageFields(r: MetadataResult): Omit<MetadataResult, 'coverUrl' | 'headerImageUrl'> & {
  coverUrl?: undefined;
  headerImageUrl?: undefined;
} {
  const { coverUrl: _c, headerImageUrl: _h, ...rest } = r;
  return rest;
}

export async function resolveMetadata(input: ResolveInput): Promise<MetadataResult> {
  const fetchCovers = input.fetchCovers !== false;
  let coverPrefs: CoverSourcePreferences | undefined;
  if (fetchCovers) {
    coverPrefs = await loadCoverSourcePreferences();
  }

  let enrichedInput = { ...input };
  let editionHint: string | null = null;
  let gpsFound = false;

  if (input.barcode && !input.titleHint) {
    const fromIgdbBarcode = await resolveFromIgdb({ barcode: input.barcode });
    if (fromIgdbBarcode && fromIgdbBarcode.status !== 'error') {
      if (!fetchCovers) {
        return {
          ...omitImageFields(fromIgdbBarcode),
          status: fromIgdbBarcode.status,
          source: fromIgdbBarcode.source,
        } as unknown as MetadataResult;
      }
      const { url } = await resolvePreferredCoverWithSource(
        fromIgdbBarcode.title,
        input.platformHint,
        fromIgdbBarcode.coverUrl,
        coverPrefs
      );
      return finalizeMetadataResult({
        ...fromIgdbBarcode,
        coverUrl: url ?? null,
      });
    }

    const barcodeResult = await barcodeToTitle(input.barcode);
    if (barcodeResult) {
      gpsFound = true;
      enrichedInput = {
        ...input,
        titleHint: barcodeResult.title,
        platformHint: input.platformHint ?? barcodeResult.platformHint,
      };
      editionHint = barcodeResult.editionHint;
    }
  }

  const fromIgdb = await resolveFromIgdb(enrichedInput);
  if (fromIgdb && fromIgdb.status !== 'error') {
    if (!fetchCovers) {
      const version = fromIgdb.version ?? editionHint ?? null;
      return {
        ...omitImageFields(fromIgdb),
        status: fromIgdb.status,
        source: fromIgdb.source,
        version,
      } as unknown as MetadataResult;
    }
    const { url } = await resolvePreferredCoverWithSource(
      fromIgdb.title,
      enrichedInput.platformHint,
      fromIgdb.coverUrl,
      coverPrefs
    );
    const version = fromIgdb.version ?? editionHint ?? null;
    return finalizeMetadataResult({
      ...fromIgdb,
      coverUrl: url ?? null,
      version,
    });
  }

  const fromScreenScraper = await resolveFromScreenScraper(enrichedInput);
  if (fromScreenScraper && fromScreenScraper.status !== 'error') {
    if (!fetchCovers) {
      const version = fromScreenScraper.version ?? editionHint ?? null;
      return {
        ...omitImageFields(fromScreenScraper),
        status: fromScreenScraper.status,
        source: fromScreenScraper.source,
        version,
      } as unknown as MetadataResult;
    }
    const { url } = await resolvePreferredCoverWithSource(
      fromScreenScraper.title,
      enrichedInput.platformHint,
      fromScreenScraper.coverUrl,
      coverPrefs
    );
    const version = fromScreenScraper.version ?? editionHint ?? null;
    return finalizeMetadataResult({
      ...fromScreenScraper,
      coverUrl: url ?? null,
      version,
      ...headerPatchFromProviderCover(fromScreenScraper.coverUrl),
    });
  }

  const bestError = fromIgdb ?? fromScreenScraper;
  const fallbackTitle = enrichedInput.titleHint ?? (input.barcode ? `Juego ${input.barcode}` : 'Juego desconocido');
  const userTitleForCover = (enrichedInput.titleHint ?? input.titleHint ?? '').trim();
  const userPlatformForCover = enrichedInput.platformHint ?? input.platformHint ?? null;

  if (fetchCovers && coverPrefs) {
    const tryCoverFromFicha = () =>
      userTitleForCover
        ? resolvePreferredCoverWithSource(userTitleForCover, userPlatformForCover, null, coverPrefs).then((r) => r.url)
        : Promise.resolve(null);

    if (gpsFound && enrichedInput.titleHint) {
      const coverUrl = await tryCoverFromFicha();
      return finalizeMetadataResult({
        title: fallbackTitle,
        platform: enrichedInput.platformHint ?? 'Plataforma desconocida',
        version: editionHint,
        status: 'partial',
        source: coverUrl ? 'cover_fallback' : 'local',
        coverUrl: coverUrl ?? undefined,
        error: coverUrl ? undefined : bestError?.error ?? 'igdb_not_found',
      });
    }

    if (userTitleForCover) {
      const coverUrl = await tryCoverFromFicha();
      if (coverUrl) {
        return finalizeMetadataResult({
          title: fallbackTitle,
          platform: userPlatformForCover?.trim() || 'Plataforma desconocida',
          version: editionHint,
          status: 'partial',
          source: 'cover_fallback',
          coverUrl,
        });
      }
    }
  } else {
    if (gpsFound && enrichedInput.titleHint) {
      return {
        title: fallbackTitle,
        platform: enrichedInput.platformHint ?? 'Plataforma desconocida',
        version: editionHint,
        status: 'partial',
        source: 'local',
        error: bestError?.error ?? 'igdb_not_found',
      };
    }
  }

  return {
    title: fallbackTitle,
    platform: userPlatformForCover?.trim() || 'Plataforma desconocida',
    version: editionHint,
    status: 'error',
    source: bestError?.source ?? 'local',
    error: bestError?.error ?? 'fallback_local',
  };
}
