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

export function CardTrailerModal({ id, type, onClose }: Props) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {data ? (
          <TrailerHero
            videos={data.videos}
            backdrop_path={data.backdrop_path}
            title={title}
            zoom={1.4}
            logo={logoUrl}
          />
        ) : (
          <div className="h-[220px] md:h-[420px] bg-zinc-900 animate-pulse rounded-3xl" />
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {data && (
          <div className="p-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">{title}</h2>
              <p className="text-white/50 text-xs mt-1 line-clamp-2">{data.overview}</p>
            </div>
            <button
              onClick={() => navigate(`/${type}/${id}`)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              More Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
