import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Star } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/services/supabase';
import { toast } from 'sonner';
import { WeatherRecommendations } from '@/src/components/WeatherRecommendations';
import { TrailerHero } from '@/src/components/TrailerHero';

// ─── MovieRow ─────────────────────────────────────────────────────────────────
function MovieRow({ title, data, loading, type }: { title: string; data: any; loading: boolean; type: 'movie' | 'tv' }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-6 md:px-12">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <div className="hidden md:flex gap-1">
          <button onClick={() => scroll('left')} aria-label="Scroll left" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} aria-label="Scroll right" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-6 md:px-12">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-[130px] md:w-[160px] shrink-0 rounded-xl" />
            ))
          : data?.results?.slice(0, 20).map((item: any) => (
              <div key={item.id} className="w-[130px] md:w-[160px] shrink-0">
                <ContentCard item={item} type={item.media_type || type} />
              </div>
            ))}
      </div>
    </section>
  );
}

// ─── HomeHero ─────────────────────────────────────────────────────────────────
function HomeHero({ item }: { item: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const type = item?.title ? 'movie' : 'tv';
  const title = item.title || item.name;
  const logo = item.images?.logos?.find((l: any) => l.iso_639_1 === 'en') ?? item.images?.logos?.[0];

  const { data: watchlistStatus } = useQuery({
    queryKey: ['watchlist', item.id, user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase.from('watchlist').select('id').eq('user_id', user.id).eq('content_id', String(item.id)).single();
      return data;
    },
    enabled: !!user && !!item,
    staleTime: 1000 * 60 * 2,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      if (watchlistStatus) {
        await supabase.from('watchlist').delete().eq('id', watchlistStatus.id);
      } else {
        await supabase.from('watchlist').insert({ user_id: user.id, content_id: String(item.id), content_type: type, status: 'plan_to_watch' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', item.id, user?.id] });
      toast.success(watchlistStatus ? 'Removed from watchlist' : 'Added to watchlist');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="relative">
      <TrailerHero videos={item.videos} backdrop_path={item.backdrop_path} title={title} />

      {/* Overlay */}
      <div className="absolute bottom-6 left-0 px-8 md:px-16 max-w-2xl z-20 pointer-events-none">
        {logo ? (
          <img
            src={tmdb.getImageUrl(logo.file_path, 'original')}
            alt={title}
            className="h-16 md:h-24 w-auto object-contain mb-4 drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-none drop-shadow-2xl">{title}</h1>
        )}
        <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1 text-yellow-500 font-bold">
              <Star className="h-3.5 w-3.5 fill-yellow-500" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
          <span>{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
          {item.genres?.slice(0, 2).map((g: any) => (
            <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{g.name}</span>
          ))}
        </div>
        <p className="text-sm md:text-base text-white/70 line-clamp-2 mb-5 leading-relaxed drop-shadow">{item.overview}</p>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => toggleWatchlist.mutate()}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/15 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/25 transition-colors border border-white/20"
          >
            <Plus className="h-4 w-4" />
            {watchlistStatus ? 'In Watchlist' : 'Watchlist'}
          </button>
          <Link
            to={`/${type}/${item.id}`}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
          >
            <Info className="h-4 w-4" /> More Info
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => tmdb.getTrending('all'),
    staleTime: 1000 * 60 * 15,
  });

  const heroItem = trending?.results?.[0];

  const { data: heroDetails } = useQuery({
    queryKey: ['heroDetails', heroItem?.id],
    queryFn: () =>
      heroItem.media_type === 'tv'
        ? tmdb.getSeriesDetails(String(heroItem.id))
        : tmdb.getMovieDetails(String(heroItem.id)),
    enabled: !!heroItem,
    staleTime: 1000 * 60 * 15,
  });

  const { data: continueWatching } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id).eq('status', 'watching').order('created_at', { ascending: false }).limit(10);
      return data;
    },
    enabled: !!user && !!supabase,
  });

  const { data: nowPlayingMovies, isLoading: pmLoading } = useQuery({ queryKey: ['nowPlaying'], queryFn: () => tmdb.getNowPlayingMovies(), staleTime: 1000 * 60 * 30 });
  const { data: onAirSeries, isLoading: psLoading } = useQuery({ queryKey: ['onTheAir'], queryFn: () => tmdb.getOnTheAirSeries(), staleTime: 1000 * 60 * 30 });
  const { data: latestMovies, isLoading: lmLoading } = useQuery({ queryKey: ['upcomingMovies'], queryFn: () => tmdb.getUpcomingMovies(), staleTime: 1000 * 60 * 30 });
  const { data: actionMovies, isLoading: amLoading } = useQuery({ queryKey: ['actionMovies'], queryFn: () => tmdb.getMoviesByGenre('28'), staleTime: 1000 * 60 * 60 });
  const { data: comedyMovies, isLoading: cmLoading } = useQuery({ queryKey: ['comedyMovies'], queryFn: () => tmdb.getMoviesByGenre('35'), staleTime: 1000 * 60 * 60 });
  const { data: animeMovies, isLoading: animeMLoading } = useQuery({ queryKey: ['animeMovies'], queryFn: () => tmdb.discoverMovies({ with_genres: '16', sort_by: 'popularity.desc' }), staleTime: 1000 * 60 * 60 });
  const { data: animeSeries, isLoading: animeSLoading } = useQuery({ queryKey: ['animeSeries'], queryFn: () => tmdb.discoverMovies({ with_genres: '16', sort_by: 'popularity.desc' }), staleTime: 1000 * 60 * 60 });

  return (
    <div className="bg-black pt-20">
      {heroDetails ? (
        <HomeHero item={heroDetails} />
      ) : (
        <Skeleton className="h-[220px] md:h-[420px] mx-4 md:mx-8 rounded-3xl" />
      )}

      <div className="mt-6">
        {user && continueWatching && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" data={{ results: continueWatching }} loading={false} type="movie" />
        )}

        <WeatherRecommendations />

        <MovieRow title="Trending Now" data={trending} loading={trendingLoading} type="movie" />
        <MovieRow title="Now Playing" data={nowPlayingMovies} loading={pmLoading} type="movie" />
        <MovieRow title="Currently Streaming" data={onAirSeries} loading={psLoading} type="tv" />
        <MovieRow title="Coming Soon" data={latestMovies} loading={lmLoading} type="movie" />
        <MovieRow title="Trending Anime" data={animeMovies} loading={animeMLoading} type="movie" />
        <MovieRow title="Popular Anime" data={animeSeries} loading={animeSLoading} type="tv" />
        <MovieRow title="Action Movies" data={actionMovies} loading={amLoading} type="movie" />
        <MovieRow title="Comedy Movies" data={comedyMovies} loading={cmLoading} type="movie" />

        <footer className="mt-16 border-t border-white/10 py-10 px-6 md:px-12">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} SceneFinds. Powered by TMDB API.
          </p>
        </footer>
      </div>
    </div>
  );
}
