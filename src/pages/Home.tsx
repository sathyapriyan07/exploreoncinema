import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Play, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/services/supabase';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Studios ────────────────────────────────────────────────────────────────
const STUDIOS = [
  { name: 'Marvel', id: '420', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/320px-Marvel_Logo.svg.png' },
  { name: 'Disney', id: '2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/320px-Disney%2B_logo.svg.png' },
  { name: 'DC', id: '9993', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DC_Comics_logo.svg/320px-DC_Comics_logo.svg.png' },
  { name: 'Pixar', id: '3', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Pixar_logo.svg/320px-Pixar_logo.svg.png' },
  { name: 'Warner Bros', id: '174', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/320px-Warner_Bros_logo.svg.png' },
  { name: 'Universal', id: '33', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Universal_Pictures_logo.svg/320px-Universal_Pictures_logo.svg.png' },
  { name: 'Sony', id: '5', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/320px-Sony_logo.svg.png' },
  { name: 'A24', id: '41077', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/A24_logo.svg/320px-A24_logo.svg.png' },
];

// ─── Streaming Platforms ─────────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'Netflix', color: '#E50914', letter: 'N' },
  { name: 'Prime Video', color: '#00A8E0', letter: 'P' },
  { name: 'Disney+', color: '#113CCF', letter: 'D+' },
  { name: 'Hulu', color: '#1CE783', letter: 'H' },
  { name: 'Apple TV+', color: '#555', letter: '🍎' },
  { name: 'HBO Max', color: '#5822B4', letter: 'HBO' },
  { name: 'Peacock', color: '#0F69AF', letter: '🦚' },
  { name: 'Paramount+', color: '#0064FF', letter: 'P+' },
];

// ─── Collections ─────────────────────────────────────────────────────────────
const COLLECTIONS = [
  { name: 'Avengers', query: 'Avengers', type: 'movie' as const },
  { name: 'Fast & Furious', query: 'Fast Furious', type: 'movie' as const },
  { name: 'Harry Potter', query: 'Harry Potter', type: 'movie' as const },
  { name: 'Star Wars', query: 'Star Wars', type: 'movie' as const },
  { name: 'Mission Impossible', query: 'Mission Impossible', type: 'movie' as const },
  { name: 'John Wick', query: 'John Wick', type: 'movie' as const },
];

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
  const [muted, setMuted] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx];
  const trailer = current?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') ||
                  current?.videos?.results?.find((v: any) => v.site === 'YouTube');

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
    <div className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {trailer ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailer.key}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`}
              className="absolute inset-0 w-full h-full scale-[1.15] pointer-events-none"
              allow="autoplay; encrypted-media"
              title="trailer"
            />
          ) : (
            <img
              src={tmdb.getImageUrl(current.backdrop_path, 'original')}
              alt={title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 px-6 md:px-12 pb-24 md:pb-20 max-w-2xl">
        {logo ? (
          <img
            src={tmdb.getImageUrl(logo.file_path, 'original')}
            alt={title}
            className="h-20 md:h-28 w-auto object-contain mb-5 drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-5 leading-none">{title}</h1>
        )}
        <p className="text-sm md:text-base text-white/70 line-clamp-3 mb-6 leading-relaxed">
          {current.overview}
        </p>
        <div className="flex items-center gap-3">
          <Link
            to={`/${type}/${current.id}`}
            className="flex items-center gap-2 px-7 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-colors"
          >
            <Play className="h-4 w-4 fill-black" /> Play Now
          </Link>
          <button
            onClick={() => toggleWatchlist.mutate()}
            className="flex items-center gap-2 px-7 py-3 bg-white/15 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/25 transition-colors border border-white/20"
          >
            <Plus className="h-4 w-4" />
            {watchlistStatus ? 'In Watchlist' : 'Watchlist'}
          </button>
          <Link
            to={`/${type}/${current.id}`}
            className="hidden md:flex items-center gap-2 px-7 py-3 bg-white/10 text-white backdrop-blur-md rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
          >
            <Info className="h-4 w-4" /> More Info
          </Link>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-24 md:bottom-20 right-6 md:right-12 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1 rounded-full transition-all ${i === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
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

  const { data: popularMovies, isLoading: pmLoading } = useQuery({ queryKey: ['popularMovies'], queryFn: () => tmdb.getPopularMovies() });
  const { data: popularSeries, isLoading: psLoading } = useQuery({ queryKey: ['popularSeries'], queryFn: () => tmdb.getPopularSeries() });
  const { data: topMovies, isLoading: tmLoading } = useQuery({ queryKey: ['topRatedMovies'], queryFn: () => tmdb.getTopRatedMovies() });
  const { data: topSeries, isLoading: tsLoading } = useQuery({ queryKey: ['topRatedSeries'], queryFn: () => tmdb.getTopRatedSeries() });
  const { data: latestMovies, isLoading: lmLoading } = useQuery({ queryKey: ['nowPlaying'], queryFn: () => tmdb.getNowPlayingMovies() });
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

      <div className="pt-8">
        {/* Continue Watching */}
        {user && continueWatching && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" data={{ results: continueWatching }} loading={false} type="movie" />
        )}

        <MovieRow title="Trending Now" data={trending} loading={trendingLoading} type="movie" />
        <MovieRow title="Top 10 Movies" data={topMovies} loading={tmLoading} type="movie" />
        <MovieRow title="Top 10 TV Shows" data={topSeries} loading={tsLoading} type="tv" />
        <MovieRow title="Popular Movies" data={popularMovies} loading={pmLoading} type="movie" />
        <MovieRow title="Popular TV Series" data={popularSeries} loading={psLoading} type="tv" />
        <MovieRow title="Trending Anime" data={animeMovies} loading={animeMLoading} type="movie" />
        <MovieRow title="Popular Anime" data={animeSeries} loading={animeSLoading} type="tv" />

        {/* Studios */}
        <section className="py-10 px-6 md:px-12">
          <h2 className="text-xl font-bold mb-6">Studios</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {STUDIOS.map((studio) => (
              <Link
                key={studio.id}
                to={`/search?q=${encodeURIComponent(studio.name)}`}
                className="shrink-0 h-16 w-32 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center hover:border-white/30 hover:bg-zinc-800 transition-all px-4"
              >
                <span className="text-sm font-bold text-white/70 text-center">{studio.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Streaming Platforms */}
        <section className="py-6 px-6 md:px-12">
          <h2 className="text-xl font-bold mb-6">Streaming Platforms</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="shrink-0 h-16 w-32 rounded-xl flex items-center justify-center font-black text-white text-lg cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: p.color + '33', border: `1px solid ${p.color}55` }}
              >
                <span style={{ color: p.color }}>{p.letter}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="py-6 px-6 md:px-12">
          <h2 className="text-xl font-bold mb-6">Collections</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.name}
                to={`/search?q=${encodeURIComponent(col.query)}`}
                className="shrink-0 h-20 w-44 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center hover:border-white/30 hover:from-zinc-700 transition-all px-4"
              >
                <span className="text-sm font-bold text-white text-center">{col.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <MovieRow title="Latest Movies" data={latestMovies} loading={lmLoading} type="movie" />
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
