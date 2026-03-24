import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { ExpandedCard } from '@/src/components/ExpandedCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Search as SearchIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Typewriter } from '@/src/components/ui/typewriter';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [expanded, setExpanded] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const expand = (id: number, type: 'movie' | 'tv') => setExpanded(e => e?.id === id ? null : { id, type });

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => tmdb.search(query),
    enabled: !!query,
  });

  const { data: tamilMovies, isLoading: tamilLoading } = useQuery({
    queryKey: ['tamilMoviesBrowse'],
    queryFn: () => tmdb.getMoviesByLanguage('ta'),
    enabled: !query,
  });

  const { data: malayalamMovies, isLoading: malayalamLoading } = useQuery({
    queryKey: ['malayalamMoviesBrowse'],
    queryFn: () => tmdb.getMoviesByLanguage('ml'),
    enabled: !query,
  });

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue });
    }
  };

  const renderGrid = (data: any, loading: boolean) => (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {loading
        ? Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))
        : data?.results?.filter((item: any) => item.media_type !== 'person').map((item: any) => (
            <ContentCard key={item.id} item={item} type={item.media_type || 'movie'} onExpand={() => expand(item.id, item.media_type || 'movie')} />
          ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 z-10" />
          {/* Animated placeholder — only visible when input is empty */}
          {!inputValue && (
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-lg text-white/30 pointer-events-none select-none z-10">
              <Typewriter
                text={[
                  'Search for Interstellar…',
                  'Find top rated series…',
                  'Explore trending movies…',
                  'Discover hidden gems…',
                  'Look up your favourite actor…',
                ]}
                speed={60}
                deleteSpeed={35}
                waitTime={2000}
                cursorChar="|"
                cursorClassName="text-yellow-400/70"
              />
            </span>
          )}
          <input
            type="text"
            placeholder=""
            className="h-14 w-full rounded-2xl bg-zinc-900 border border-white/10 pl-12 pr-4 text-lg outline-none ring-primary/50 transition-all focus:ring-2"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </form>
      </div>

      {query ? (
        <div>
          <h2 className="text-xl font-bold mb-8 text-white/60">
            Results for "{query}"
          </h2>
          {renderGrid(results, isLoading)}
          {expanded && <ExpandedCard key={expanded.id} id={expanded.id} type={expanded.type} onClose={() => setExpanded(null)} />}
          {!isLoading && results?.results?.length === 0 && (
            <div className="text-center py-20 text-white/40">
              No results found for "{query}"
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-8">Latest Tamil Movies</h2>
            {renderGrid(tamilMovies, tamilLoading)}
            {expanded && <ExpandedCard key={expanded.id} id={expanded.id} type={expanded.type} onClose={() => setExpanded(null)} />}
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-8">Latest Malayalam Movies</h2>
            {renderGrid(malayalamMovies, malayalamLoading)}
            {expanded && <ExpandedCard key={expanded.id} id={expanded.id} type={expanded.type} onClose={() => setExpanded(null)} />}
          </section>
        </div>
      )}
    </div>
  );
}
