import { useState } from 'react';
import { Movie, TVSeries } from '@/src/types';
import { tmdb } from '@/src/services/tmdb';
import { Star } from 'lucide-react';
import { CardTrailerModal } from '@/src/components/CardTrailerModal';

interface ContentCardProps {
  item: Movie | TVSeries;
  type: 'movie' | 'tv';
}

export function ContentCard({ item, type }: ContentCardProps) {
  const [open, setOpen] = useState(false);
  const title = 'title' in item ? item.title : item.name;
  const date = 'release_date' in item ? item.release_date : item.first_air_date;

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-xl bg-zinc-900 shadow-lg transition-transform duration-200 will-change-transform hover:scale-105 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="aspect-[2/3] w-full overflow-hidden">
          <img
            src={tmdb.getImageUrl(item.poster_path)}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <h3 className="line-clamp-1 text-sm font-bold text-white">{title}</h3>
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/60">
            <span>{date?.split('-')[0]}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {open && <CardTrailerModal id={item.id} type={type} onClose={() => setOpen(false)} />}
    </>
  );
}
