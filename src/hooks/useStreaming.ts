import { useQuery } from '@tanstack/react-query';
import { getStreamingData, WatchProvidersResult } from '../services/justwatch';

export function useStreaming(tmdbId: string, type: 'movie' | 'tv') {
  const { data, isLoading, isError } = useQuery<WatchProvidersResult>({
    queryKey: ['streaming', type, tmdbId],
    queryFn: () => getStreamingData(tmdbId, type),
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 60, // 1 hour — provider data rarely changes
    retry: 1,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: isError,
  };
}
