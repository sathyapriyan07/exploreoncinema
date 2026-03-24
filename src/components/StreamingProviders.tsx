import { useStreaming } from '../hooks/useStreaming';
import { tmdb } from '../services/tmdb';
import { Provider } from '../services/justwatch';
import { Skeleton } from './ui/skeleton';
import { ExternalLink, Tv } from 'lucide-react';

interface Props {
  tmdbId: string;
  type: 'movie' | 'tv';
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  flatrate: { label: 'Stream',   color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  free:     { label: 'Free',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  ads:      { label: 'Free w/ Ads', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  rent:     { label: 'Rent',     color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  buy:      { label: 'Buy',      color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
};

function ProviderCard({
  provider,
  monetType,
  link,
}: {
  provider: Provider;
  monetType: string;
  link: string;
}) {
  const badge = TYPE_LABEL[monetType];
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 group w-20 shrink-0"
    >
      <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all group-hover:scale-105">
        <img
          src={tmdb.getImageUrl(provider.logo_path, 'w500')}
          alt={provider.provider_name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[10px] text-white/50 text-center line-clamp-1 group-hover:text-white/80 transition-colors">
        {provider.provider_name}
      </span>
      {badge && (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
      )}
    </a>
  );
}

export function StreamingProviders({ tmdbId, type }: Props) {
  const { data, loading, error } = useStreaming(tmdbId, type);

  if (loading) {
    return (
      <section className="mt-10">
        <Skeleton className="h-5 w-36 mb-4 rounded-lg" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-14 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.providers) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-3">Where to Watch</h2>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-white/40 text-sm">
          <Tv className="h-4 w-4 shrink-0" />
          Not available for streaming in your region yet.
        </div>
      </section>
    );
  }

  const { flatrate, free, ads, rent, buy, link } = data.providers;

  const sections: { key: string; items: Provider[] | undefined }[] = [
    { key: 'flatrate', items: flatrate },
    { key: 'free',     items: free },
    { key: 'ads',      items: ads },
    { key: 'rent',     items: rent },
    { key: 'buy',      items: buy },
  ];

  const hasAny = sections.some(s => s.items?.length);
  if (!hasAny) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-3">Where to Watch</h2>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-white/40 text-sm">
          <Tv className="h-4 w-4 shrink-0" />
          Not available for streaming in your region yet.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Where to Watch</h2>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <span>Powered by JustWatch</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="space-y-6">
        {sections.map(({ key, items }) => {
          if (!items?.length) return null;
          const badge = TYPE_LABEL[key];
          return (
            <div key={key}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${badge?.color.split(' ')[1]}`}>
                {badge?.label}
              </p>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                {items
                  .sort((a, b) => a.display_priority - b.display_priority)
                  .map(provider => (
                    <ProviderCard
                      key={provider.provider_id}
                      provider={provider}
                      monetType={key}
                      link={link}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
