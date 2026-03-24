import { useQuery } from '@tanstack/react-query';
import { tmdb } from '../services/tmdb';

export interface NowPlayingMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
}

const STALE = 1000 * 60 * 30;

async function fetchAllNowPlaying(region: string): Promise<NowPlayingMovie[]> {
  const first = await tmdb.getNowPlayingMovies(1, region);
  const totalPages: number = Math.min(first.total_pages ?? 1, 5);
  const rest = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          tmdb.getNowPlayingMovies(i + 2, region)
        )
      )
    : [];
  const all = [first, ...rest].flatMap((p) => p.results ?? []);
  return Array.from(new Map(all.map((m: NowPlayingMovie) => [m.id, m])).values());
}

export function useNowPlaying(region: string) {
  return useQuery<NowPlayingMovie[]>({
    queryKey: ['nowPlayingNearYou', region],
    queryFn: () => fetchAllNowPlaying(region),
    enabled: !!region,
    staleTime: STALE,
    retry: 1,
  });
}
