import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tv2, Star, ChevronRight, Search, Loader2, Globe } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRegion } from '../hooks/useRegion';
import { useStreamingByRegion, StreamingPlatform, StreamingMovie } from '../hooks/useStreamingByRegion';
import { tmdb } from '../services/tmdb';

// ─── MovieCard ────────────────────────────────────────────────────────────────
function MovieCard({ movie }: { movie: StreamingMovie }) {
  return (
    <Link to={`/movie/${movie.id}`} className="flex flex-col shrink-0 w-[110px] group">
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-1.5">
        <img
          src={tmdb.getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/70 rounded-md px-1 py-0.5">
          <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-[10px] font-bold">
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      </div>
      <p className="text-white text-[11px] font-medium leading-tight line-clamp-2 px-0.5">
        {movie.title}
      </p>
    </Link>
  );
}

// ─── PlatformRow ──────────────────────────────────────────────────────────────
function PlatformRow({ platform }: { platform: StreamingPlatform }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') =>
    rowRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });

  return (
    <div className="mb-8">
      {/* Platform header */}
      <div className="flex items-center justify-between px-6 md:px-12 mb-3">
        <div className="flex items-center gap-2.5">
          <img
            src={tmdb.getImageUrl(platform.logo, 'w500')}
            alt={platform.name}
            className="h-7 w-7 rounded-lg object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-white font-bold text-sm">{platform.name}</span>
          <span className="text-white/30 text-xs">{platform.movies.length} titles</span>
        </div>
        <div className="hidden md:flex gap-1">
          <button onClick={() => scroll('left')} className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </button>
          <button onClick={() => scroll('right')} className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Movie scroll row */}
      <div ref={rowRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-6 md:px-12">
        {platform.movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  );
}

// ─── StreamingNearYou ─────────────────────────────────────────────────────────
export function NowPlayingNearYou() {
  const [cityInput, setCityInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const { countryCode, locationDenied, setCity } = useRegion();
  const { data: platforms = [], isLoading } = useStreamingByRegion(countryCode);

  const handleGeocode = async () => {
    if (!cityInput.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      await setCity(cityInput.trim());
      setCityInput('');
    } catch {
      setGeocodeError('City not found. Try a different name.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <section className="py-6">
      {/* Header */}
      <div className="px-6 md:px-12 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Tv2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Streaming in Your Region</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {countryCode ? (
                  <>
                    <Globe className="h-3 w-3 text-white/30" />
                    <span className="text-white/40 text-xs">
                      {platforms.length > 0
                        ? `${platforms.length} platforms available in ${countryCode}`
                        : isLoading
                        ? `Loading for ${countryCode}…`
                        : `Fetching for ${countryCode}…`}
                    </span>
                  </>
                ) : locationDenied ? (
                  <span className="text-white/40 text-xs">Enter your city to see what's streaming</span>
                ) : (
                  <span className="text-white/40 text-xs">Detecting your location…</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Manual city input */}
        {locationDenied && (
          <div className="mt-4 flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                placeholder="Enter your city…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              onClick={handleGeocode}
              disabled={geocoding || !cityInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </button>
          </div>
        )}
        {geocodeError && <p className="text-red-400 text-xs mt-1.5">{geocodeError}</p>}
      </div>

      {/* Content */}
      {isLoading || !countryCode ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-2.5 px-6 md:px-12 mb-3">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="flex gap-3 px-6 md:px-12">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} className="shrink-0 w-[110px] aspect-[2/3] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <div className="px-6 md:px-12">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 max-w-sm">
            <Tv2 className="h-5 w-5 text-white/30 shrink-0" />
            <p className="text-white/50 text-sm">No streaming data found for {countryCode}.</p>
          </div>
        </div>
      ) : (
        platforms.map((platform) => (
          <PlatformRow key={platform.id} platform={platform} />
        ))
      )}
    </section>
  );
}
