import { useRef, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Ticket, Star, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useCinemas } from '../hooks/useCinemas';
import { useNowPlaying, NowPlayingMovie } from '../hooks/useNowPlaying';
import { tmdb } from '../services/tmdb';
import { CinemaWithDistance } from '../hooks/useCinemas';

// ─── MovieChip ────────────────────────────────────────────────────────────────
function MovieChip({ movie }: { movie: NowPlayingMovie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-2.5 py-2 transition-colors shrink-0 max-w-[160px]"
    >
      <img
        src={tmdb.getImageUrl(movie.poster_path, 'w500')}
        alt={movie.title}
        className="h-10 w-7 rounded-md object-cover shrink-0"
      />
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{movie.title}</p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-[10px] font-bold">
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── CinemaCard ───────────────────────────────────────────────────────────────
function CinemaCard({
  cinema,
  movies,
}: {
  cinema: CinemaWithDistance;
  movies: NowPlayingMovie[];
}) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cinema.lat},${cinema.lon}`;

  return (
    <div className="shrink-0 w-[300px] md:w-[340px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
            <span className="text-yellow-400 text-xs font-bold">
              {cinema.distanceKm.toFixed(1)} km away
            </span>
          </div>
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{cinema.name}</h3>
          {cinema.address && (
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{cinema.address}</p>
          )}
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 h-8 w-8 rounded-full bg-yellow-500/15 hover:bg-yellow-500/30 flex items-center justify-center transition-colors"
          title="Navigate"
        >
          <Navigation className="h-3.5 w-3.5 text-yellow-400" />
        </a>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Movies */}
      <div>
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
          Likely Playing
        </p>
        <div className="flex flex-col gap-1.5">
          {movies.map((m) => (
            <MovieChip key={m.id} movie={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NowPlayingNearYou ────────────────────────────────────────────────────────
export function NowPlayingNearYou() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [cityInput, setCityInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const {
    cinemas,
    isLoading: cinemasLoading,
    locationDenied,
    manualCity,
    setManualCity,
    geocodeCity,
  } = useCinemas(radiusKm);

  const { data: movies = [], isLoading: moviesLoading } = useNowPlaying();

  // Deterministically assign movies to cinemas using cinema id as seed
  const cinemaMovies = useMemo(() => {
    if (!cinemas.length || !movies.length) return new Map<number, NowPlayingMovie[]>();
    const map = new Map<number, NowPlayingMovie[]>();
    cinemas.forEach((cinema, idx) => {
      const count = 2 + (cinema.id % 3); // 2–4 movies per cinema
      const offset = (idx * 3 + cinema.id) % movies.length;
      const assigned: NowPlayingMovie[] = [];
      for (let i = 0; i < count; i++) {
        assigned.push(movies[(offset + i) % movies.length]);
      }
      map.set(cinema.id, assigned);
    });
    return map;
  }, [cinemas, movies]);

  const scroll = (dir: 'left' | 'right') =>
    rowRef.current?.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });

  const handleGeocode = async () => {
    if (!cityInput.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      setManualCity(cityInput.trim());
      await geocodeCity(cityInput.trim());
    } catch {
      setGeocodeError('City not found. Try a different name.');
    } finally {
      setGeocoding(false);
    }
  };

  const isLoading = cinemasLoading || moviesLoading;

  return (
    <section className="py-6">
      {/* Header */}
      <div className="px-6 md:px-12 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-yellow-500/15 flex items-center justify-center shrink-0">
              <Ticket className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Now Playing Near You</h2>
              <p className="text-white/40 text-xs mt-0.5">
                {cinemas.length > 0
                  ? `${cinemas.length} theater${cinemas.length > 1 ? 's' : ''} found nearby`
                  : locationDenied
                  ? 'Enter your city to find theaters'
                  : 'Detecting your location…'}
              </p>
            </div>
          </div>

          {/* Radius filter + scroll arrows */}
          <div className="flex items-center gap-2">
            {[5, 10, 20].map((km) => (
              <button
                key={km}
                onClick={() => setRadiusKm(km)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  radiusKm === km
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {km} km
              </button>
            ))}
            <div className="hidden md:flex gap-1 ml-2">
              <button
                onClick={() => scroll('left')}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Manual city input (shown when location denied) */}
        {locationDenied && (
          <div className="mt-4 flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                placeholder={manualCity || 'Enter your city…'}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <button
              onClick={handleGeocode}
              disabled={geocoding || !cityInput.trim()}
              className="px-4 py-2 bg-yellow-500 text-black rounded-xl text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </button>
          </div>
        )}
        {geocodeError && (
          <p className="text-red-400 text-xs mt-1.5">{geocodeError}</p>
        )}
      </div>

      {/* Cinema cards row */}
      {isLoading ? (
        <div className="flex gap-4 px-6 md:px-12 overflow-x-auto scrollbar-hide pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[300px] md:w-[340px] h-[220px] rounded-2xl" />
          ))}
        </div>
      ) : cinemas.length === 0 && !locationDenied ? (
        <div className="px-6 md:px-12">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 max-w-sm">
            <MapPin className="h-5 w-5 text-white/30 shrink-0" />
            <p className="text-white/50 text-sm">No theaters found within {radiusKm} km. Try a larger radius.</p>
          </div>
        </div>
      ) : (
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 px-6 md:px-12"
        >
          {cinemas.map((cinema) => (
            <CinemaCard
              key={cinema.id}
              cinema={cinema}
              movies={cinemaMovies.get(cinema.id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  );
}
