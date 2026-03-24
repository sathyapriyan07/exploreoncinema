import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/services/supabase';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { WeatherRecommendations } from '@/src/components/WeatherRecommendations';
import { NowPlayingNearYou } from '@/src/components/NowPlayingNearYou';

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
          <button onClick={() => scroll('left')} className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
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

// ─── CinematicHero ────────────────────────────────────────────────────────────
function CinematicHero({ items }: { items: any[] }) {
  const [idx, setIdx] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx];

  const { data: watchlistStatus } = useQuery({
    queryKey: ['watchlist', current?.id, user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id).eq('content_id', String(current.id)).single();
      return data;
    },
    enabled: !!user && !!current?.id && !!supabase,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      const type = current.title ? 'movie' : 'tv';
      if (watchlistStatus) {
        await supabase.from('watchlist').delete().eq('id', watchlistStatus.id);
      } else {
        await supabase.from('watchlist').insert({ user_id: user.id, content_id: String(current.id), content_type: type, status: 'plan_to_watch' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', current?.id, user?.id] });
      toast.success(watchlistStatus ? 'Removed from watchlist' : 'Added to watchlist');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!current) return <Skeleton className="h-screen w-full" />;

  const type = current.title ? 'movie' : 'tv';
  const title = current.title || current.name;
  const logo = current.images?.logos?.find((l: any) => l.iso_639_1 === 'en') || current.images?.logos?.[0];

  return (
    <div
      className="relative h-[55vh] md:h-screen w-full overflow-hidden cursor-pointer"
      onTouchStart={(e) => { const x = e.touches[0].clientX; (e.currentTarget as any)._touchX = x; }}
      onTouchEnd={(e) => {
        const diff = (e.currentTarget as any)._touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) setIdx(p => diff > 0 ? (p + 1) % items.length : (p - 1 + items.length) % items.length);
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
              src={tmdb.getImageUrl(current.backdrop_path, 'original')}
              alt={title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      {/* Clickable backdrop */}
      <Link to={`/${type}/${current.id}`} className="absolute inset-0" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 px-6 md:px-12 pb-24 md:pb-20 max-w-2xl">
        {logo ? (
          <Link to={`/${type}/${current.id}`}>
            <img
              src={tmdb.getImageUrl(logo.file_path, 'original')}
              alt={title}
              className="h-20 md:h-28 w-auto object-contain mb-5 drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </Link>
        ) : (
          <Link to={`/${type}/${current.id}`}>
            <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-5 leading-none hover:underline">{title}</h1>
          </Link>
        )}
        <p className="text-sm md:text-base text-white/70 line-clamp-3 mb-6 leading-relaxed">
          {current.overview}
        </p>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={(e) => { e.preventDefault(); toggleWatchlist.mutate(); }}
            className="flex items-center gap-2 px-7 py-3 bg-white/15 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/25 transition-colors border border-white/20"
          >
            <Plus className="h-4 w-4" />
            {watchlistStatus ? 'In Watchlist' : 'Watchlist'}
          </button>
          <Link
            to={`/${type}/${current.id}`}
            className="flex items-center gap-2 px-7 py-3 bg-white/10 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-4 w-4" /> More Info
          </Link>
        </div>
      </div>

      {/* Indicators - hidden, touch/auto only */}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => tmdb.getTrending('all'),
  });

  // Fetch details for top 5 trending to get videos/images
  const top5 = trending?.results?.slice(0, 5) ?? [];
  const { data: heroItems } = useQuery({
    queryKey: ['heroDetails', top5.map((i: any) => i.id).join(',')],
    queryFn: () =>
      Promise.all(
        top5.map((item: any) =>
          item.media_type === 'tv'
            ? tmdb.getSeriesDetails(String(item.id))
            : tmdb.getMovieDetails(String(item.id))
        )
      ),
    enabled: top5.length > 0,
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

  const { data: nowPlayingMovies, isLoading: pmLoading } = useQuery({ queryKey: ['nowPlaying'], queryFn: () => tmdb.getNowPlayingMovies() });
  const { data: onAirSeries, isLoading: psLoading } = useQuery({ queryKey: ['onTheAir'], queryFn: () => tmdb.getOnTheAirSeries() });
  const { data: latestMovies, isLoading: lmLoading } = useQuery({ queryKey: ['upcomingMovies'], queryFn: () => tmdb.getUpcomingMovies() });
  const { data: actionMovies, isLoading: amLoading } = useQuery({ queryKey: ['actionMovies'], queryFn: () => tmdb.getMoviesByGenre('28') });
  const { data: comedyMovies, isLoading: cmLoading } = useQuery({ queryKey: ['comedyMovies'], queryFn: () => tmdb.getMoviesByGenre('35') });
  const { data: animeMovies, isLoading: animeMLoading } = useQuery({ queryKey: ['animeMovies'], queryFn: () => tmdb.discoverMovies({ with_genres: '16', sort_by: 'popularity.desc' }) });
  const { data: animeSeries, isLoading: animeSLoading } = useQuery({ queryKey: ['animeSeries'], queryFn: () => tmdb.discoverMovies({ with_genres: '16', sort_by: 'popularity.desc' }) });

  return (
    <div className="bg-black">
      {/* Cinematic Hero */}
      {heroItems && heroItems.length > 0 ? (
        <CinematicHero items={heroItems} />
      ) : (
        <Skeleton className="h-screen w-full" />
      )}

      <div className="-mt-16 md:-mt-24 relative z-10">
        {/* Continue Watching */}
        {user && continueWatching && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" data={{ results: continueWatching }} loading={false} type="movie" />
        )}

        <WeatherRecommendations />

        <NowPlayingNearYou />

        <MovieRow title="Trending Now" data={trending} loading={trendingLoading} type="movie" />
        <MovieRow title="Now Playing" data={nowPlayingMovies} loading={pmLoading} type="movie" />
        <MovieRow title="Currently Streaming" data={onAirSeries} loading={psLoading} type="tv" />
        <MovieRow title="Coming Soon" data={latestMovies} loading={lmLoading} type="movie" />
        <MovieRow title="Trending Anime" data={animeMovies} loading={animeMLoading} type="movie" />
        <MovieRow title="Popular Anime" data={animeSeries} loading={animeSLoading} type="tv" />
        <MovieRow title="Action Movies" data={actionMovies} loading={amLoading} type="movie" />
        <MovieRow title="Comedy Movies" data={comedyMovies} loading={cmLoading} type="movie" />

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 py-10 px-6 md:px-12">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} SceneFinds. Powered by TMDB API.
          </p>
        </footer>
      </div>
    </div>
  );
}
