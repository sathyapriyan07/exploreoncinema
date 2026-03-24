import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Star, ChevronRight, Sparkles, Tv } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { ContentCard } from '@/src/components/cards/ContentCard';

export default function SeriesDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: series, isLoading } = useQuery({
    queryKey: ['series', id],
    queryFn: () => tmdb.getSeriesDetails(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-[60vh] w-full rounded-3xl" /></div>;
  if (!series) return <div className="text-center py-20">Series not found</div>;

  return (
    <div className="pb-20 pt-20">
      {/* Hero — rounded rectangle */}
      <div className="px-4 md:px-8">
        <div className="relative w-full h-[220px] md:h-[360px] rounded-3xl overflow-hidden">
          <img
            src={tmdb.getImageUrl(series.backdrop_path, 'original')}
            alt={series.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="w-44 md:w-56 shrink-0 mx-auto md:mx-0 -mt-20 md:-mt-28 relative z-10">
            <img
              src={tmdb.getImageUrl(series.poster_path)}
              alt={series.name}
              className="rounded-2xl shadow-2xl border border-white/10 w-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 text-white pt-4 md:pt-4">
            <h1 className="text-4xl font-black mb-2">{series.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
              <span className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="h-4 w-4 fill-yellow-500" />
                {series.vote_average.toFixed(1)}
              </span>
              <span>{series.first_air_date?.split('-')[0]}</span>
              <span>{series.number_of_seasons} Seasons</span>
            </div>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-3xl">
              {series.overview}
            </p>
          </div>
        </div>

        {/* Cast */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Top Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {series.credits?.cast?.slice(0, 10).map((person: any) => (
              <Link key={person.id} to={`/person/${person.id}`} className="w-32 shrink-0 group">
                <div className="aspect-square rounded-full overflow-hidden mb-2 border-2 border-white/10 group-hover:border-primary transition-colors">
                  <img
                    src={tmdb.getImageUrl(person.profile_path)}
                    alt={person.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs font-bold text-center line-clamp-1 group-hover:text-primary transition-colors">{person.name}</p>
                <p className="text-[10px] text-white/40 text-center line-clamp-1">{person.character}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Seasons</h2>
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-8 overflow-x-auto flex justify-start">
              {series.seasons?.map((season: any) => (
                <TabsTrigger 
                  key={season.id} 
                  value={season.season_number.toString()}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black"
                >
                  Season {season.season_number}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {series.seasons?.map((season: any) => (
              <TabsContent key={season.id} value={season.season_number.toString()}>
                <SeasonEpisodes seriesId={id!} seasonNumber={season.season_number} />
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Similar Series */}
        {series.similar?.results?.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Tv className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Similar Series</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {series.similar.results.slice(0, 15).map((item: any) => (
                <div key={item.id} className="w-[160px] sm:w-[200px] shrink-0">
                  <ContentCard item={item} type="tv" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {series.recommendations?.results?.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">You Might Also Like</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {series.recommendations.results.slice(0, 15).map((item: any) => (
                <div key={item.id} className="w-[160px] sm:w-[200px] shrink-0">
                  <ContentCard item={item} type="tv" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SeasonEpisodes({ seriesId, seasonNumber }: { seriesId: string; seasonNumber: number }) {
  const { data: season, isLoading } = useQuery({
    queryKey: ['season', seriesId, seasonNumber],
    queryFn: () => tmdb.getSeasonDetails(seriesId, seasonNumber),
  });

  if (isLoading) return <div className="grid gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  return (
    <div className="grid gap-4">
      {season?.episodes?.map((episode: any) => (
        <Link 
          key={episode.id} 
          to={`/tv/${seriesId}/season/${seasonNumber}/episode/${episode.episode_number}`}
          className="group flex gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all"
        >
          <div className="w-40 shrink-0 aspect-video rounded-lg overflow-hidden relative">
            <img
              src={tmdb.getImageUrl(episode.still_path)}
              alt={episode.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white group-hover:text-primary transition-colors">
                {episode.episode_number}. {episode.name}
              </h3>
              <span className="text-[10px] text-white/40">{episode.air_date}</span>
            </div>
            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
              {episode.overview || 'No overview available for this episode.'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
