import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'api_credentials_v2';

export type ApiCredentials = {
  screenScraperUsername: string;
  screenScraperPassword: string;
  screenScraperDevId: string;
  screenScraperDevPassword: string;
  steamGridDbApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
  /** Token API PriceCharting Pro (parámetro t) */
  priceChartingToken: string;
  /** eBay Developers: para mediana de anuncios activos (Browse API) */
  ebayClientId: string;
  ebayClientSecret: string;
  /** p.ej. EBAY_ES, EBAY_US */
  ebayMarketplaceId: string;
};

export const providerLinks = {
  screenScraper: 'https://www.screenscraper.fr',
  steamGridDb: 'https://www.steamgriddb.com',
  igdb: 'https://dev.twitch.tv/console',
  priceCharting: 'https://www.pricecharting.com/pricecharting-pro?f=api',
  ebayDevelopers: 'https://developer.ebay.com',
};

const EMPTY: ApiCredentials = {
  screenScraperUsername: '',
  screenScraperPassword: '',
  screenScraperDevId: '',
  screenScraperDevPassword: '',
  steamGridDbApiKey: '',
  igdbClientId: '',
  igdbClientSecret: '',
  priceChartingToken: '',
  ebayClientId: '',
  ebayClientSecret: '',
  ebayMarketplaceId: 'EBAY_ES',
};

export async function getApiCredentials(): Promise<ApiCredentials> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw) as Partial<ApiCredentials>;
    return {
      screenScraperUsername: parsed.screenScraperUsername ?? '',
      screenScraperPassword: parsed.screenScraperPassword ?? '',
      screenScraperDevId: parsed.screenScraperDevId ?? '',
      screenScraperDevPassword: parsed.screenScraperDevPassword ?? '',
      steamGridDbApiKey: parsed.steamGridDbApiKey ?? '',
      igdbClientId: parsed.igdbClientId ?? '',
      igdbClientSecret: parsed.igdbClientSecret ?? '',
      priceChartingToken: parsed.priceChartingToken ?? '',
      ebayClientId: parsed.ebayClientId ?? '',
      ebayClientSecret: parsed.ebayClientSecret ?? '',
      ebayMarketplaceId: parsed.ebayMarketplaceId?.trim() || 'EBAY_ES',
    };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveApiCredentials(input: ApiCredentials) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(input));
}

export async function clearApiCredentials() {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
