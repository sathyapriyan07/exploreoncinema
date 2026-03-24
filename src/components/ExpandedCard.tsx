import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { X, Info } from 'lucide-react';
import { tmdb } from '@/src/services/tmdb';
import { TrailerHero } from './TrailerHero';

interface Props {
  id: number;
  type: 'movie' | 'tv';
  onClose: () => void;
}

export function ExpandedCard({ id, type, onClose }: Props) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['cardDetail', type, id],
    queryFn: () => type === 'tv' ? tmdb.getSeriesDetails(String(id)) : tmdb.getMovieDetails(String(id)),
    staleTime: 1000 * 60 * 15,
  });

  const title = data?.title || data?.name || '';
  const logo = data?.images?.logos?.find((l: any) => l.iso_639_1 === 'en') ?? data?.images?.logos?.[0];
  const logoUrl = logo ? tmdb.getImageUrl(logo.file_path, 'original') : null;

  return (
    <div className="w-full pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/10 mx-4 md:mx-8">
        {data ? (
          <TrailerHero
            videos={data.videos}
            backdrop_path={data.backdrop_path}
            title={title}
            zoom={1.4}
            logo={logoUrl}
            logoSize="sm"
          />
        ) : (
          <div className="h-[200px] bg-zinc-900 animate-pulse" />
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {data && (
          <div className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white text-sm leading-tight line-clamp-1">{title}</h2>
              <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{data.overview}</p>
            </div>
            <button
              onClick={() => navigate(`/${type}/${id}`)}
              className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              <Info className="h-3 w-3" />
              More Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
