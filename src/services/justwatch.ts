import { tmdb } from './tmdb';

export type MonetizationType = 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface ProviderGroup {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  link: string;
}

export interface WatchProvidersResult {
  providers: ProviderGroup | null;
  justwatchUrl: string | null;
}

const LOCALE = 'IN'; // India

export async function getStreamingData(
  tmdbId: string,
  type: 'movie' | 'tv'
): Promise<WatchProvidersResult> {
  const data = await tmdb.getWatchProviders(tmdbId, type);
  const region = data?.results?.[LOCALE] ?? null;

  return {
    providers: region
      ? {
          flatrate: region.flatrate,
          rent: region.rent,
          buy: region.buy,
          free: region.free,
          ads: region.ads,
          link: region.link,
        }
      : null,
    justwatchUrl: region?.link ?? null,
  };
}
