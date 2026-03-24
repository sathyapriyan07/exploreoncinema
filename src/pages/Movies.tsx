import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function MovieRow({ title, data, loading }: { title: string; data: any; loading: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') =>
    rowRef.current?.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-6 md:px-12">
        <h2 className="text-xl font-bold">{title}</h2>
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
                <ContentCard item={item} type="movie" />
              </div>
            ))}
      </div>
    </section>
  );
}

export default function Movies() {
  const { data: popular, isLoading: pl } = useQuery({ queryKey: ['popularMovies'], queryFn: () => tmdb.getPopularMovies() });
  const { data: topRated, isLoading: tl } = useQuery({ queryKey: ['topRatedMovies'], queryFn: () => tmdb.getTopRatedMovies() });
  const { data: latest, isLoading: ll } = useQuery({ queryKey: ['nowPlaying'], queryFn: () => tmdb.getNowPlayingMovies() });
  const { data: action, isLoading: al } = useQuery({ queryKey: ['actionMovies'], queryFn: () => tmdb.getMoviesByGenre('28') });
  const { data: comedy, isLoading: cl } = useQuery({ queryKey: ['comedyMovies'], queryFn: () => tmdb.getMoviesByGenre('35') });

  return (
    <div className="bg-black min-h-screen pt-24 pb-8">
      <div className="px-6 md:px-12 mb-6">
        <h1 className="font-display text-4xl font-black">Movies</h1>
      </div>
      <MovieRow title="Popular Movies" data={popular} loading={pl} />
      <MovieRow title="Top Rated" data={topRated} loading={tl} />
      <MovieRow title="Latest Movies" data={latest} loading={ll} />
      <MovieRow title="Action" data={action} loading={al} />
      <MovieRow title="Comedy" data={comedy} loading={cl} />
    </div>
  );
}
