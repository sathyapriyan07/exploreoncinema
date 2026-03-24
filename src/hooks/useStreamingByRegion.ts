import { useQuery } from '@tanstack/react-query';
import { tmdb } from '../services/tmdb';

export interface StreamingMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface StreamingPlatform {
  id: string;
  name: string;
  logo: string;        // TMDB logo path
  movies: StreamingMovie[];
}

// Major streaming provider IDs on TMDB (JustWatch-sourced)
const PROVIDERS = [
  { id: '8',   name: 'Netflix',      logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: '119', name: 'Amazon Prime', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: '337', name: 'Disney+',      logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19d.jpg' },
  { id: '384', name: 'HBO Max',      logo: '/Ajqyt5aNxNx9pi2RiAttpshalEu.jpg' },
  { id: '15',  name: 'Hulu',         logo: '/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
  { id: '283', name: 'Crunchyroll',  logo: '/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg' },
  { id: '122', name: 'Hotstar',      logo: '/7THEBMkBMOfAgt0oCxDkMFE3RNh.jpg' },
  { id: '220', name: 'JioCinema',    logo: '/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.jpg' },
  { id: '237', name: 'SonyLIV',      logo: '/mhseqK3TKikFkAhB8IDJ8tB9rio.jpg' },
];

const STALE = 1000 * 60 * 30;

async function fetchPlatformMovies(
  providerId: string,
  region: string
): Promise<StreamingMovie[]> {
  const first = await tmdb.discoverStreaming(region, providerId, 1);
  const totalPages = Math.min(first.total_pages ?? 1, 3);
  const rest = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          tmdb.discoverStreaming(region, providerId, i + 2)
        )
      )
    : [];
  return [first, ...rest].flatMap((p) => p.results ?? []);
}

export function useStreamingByRegion(countryCode: string) {
  return useQuery<StreamingPlatform[]>({
    queryKey: ['streamingByRegion', countryCode],
    queryFn: async () => {
      const results = await Promise.allSettled(
        PROVIDERS.map(async (provider) => {
          const movies = await fetchPlatformMovies(provider.id, countryCode);
          return { ...provider, movies } satisfies StreamingPlatform;
        })
      );
      return results
        .filter((r): r is PromiseFulfilledResult<StreamingPlatform> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((p) => p.movies.length > 0); // only show platforms with content in this region
    },
    enabled: !!countryCode,
    staleTime: STALE,
    retry: 1,
  });
}
