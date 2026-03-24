import { useQuery } from '@tanstack/react-query';
import { tmdb } from '../services/tmdb';

export interface NowPlayingMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
}

const STALE = 1000 * 60 * 30;

export function useNowPlaying() {
  return useQuery<NowPlayingMovie[]>({
    queryKey: ['nowPlayingNearYou'],
    queryFn: async () => {
      const data = await tmdb.getNowPlayingMovies();
      return (data.results ?? []).slice(0, 15);
    },
    staleTime: STALE,
    retry: 1,
  });
}
