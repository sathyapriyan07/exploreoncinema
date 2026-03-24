import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { ExpandedCard } from '@/src/components/ExpandedCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function TVRow({ title, data, loading }: { title: string; data: any; loading: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const expand = (id: number) => setExpanded(e => e?.id === id ? null : { id, type: 'tv' });
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
                <ContentCard item={item} type="tv" onExpand={() => expand(item.id)} />
              </div>
            ))}
      </div>
      {expanded && <ExpandedCard key={expanded.id} id={expanded.id} type={expanded.type} onClose={() => setExpanded(null)} />}
    </section>
  );
}

export default function TVShows() {
  const { data: popular, isLoading: pl } = useQuery({ queryKey: ['popularSeries'], queryFn: () => tmdb.getPopularSeries() });
  const { data: topRated, isLoading: tl } = useQuery({ queryKey: ['topRatedSeries'], queryFn: () => tmdb.getTopRatedSeries() });
  const { data: onAir, isLoading: ol } = useQuery({ queryKey: ['onTheAir'], queryFn: () => tmdb.getOnTheAirSeries() });

  return (
    <div className="bg-black min-h-screen pt-24 pb-8">
      <div className="px-6 md:px-12 mb-6">
        <h1 className="font-display text-4xl font-black">TV Shows</h1>
      </div>
      <TVRow title="Popular TV Shows" data={popular} loading={pl} />
      <TVRow title="Top Rated TV Shows" data={topRated} loading={tl} />
      <TVRow title="On The Air" data={onAir} loading={ol} />
    </div>
  );
}
