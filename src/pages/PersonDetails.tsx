import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Star, Calendar, MapPin, User, Film, Tv } from 'lucide-react';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { useState } from 'react';

type Tab = 'movies' | 'tv';

export default function PersonDetails() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('movies');

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: () => tmdb.getPersonDetails(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="container mx-auto p-8 pt-28">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="h-[450px] w-full md:w-72 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!person) return <div className="text-center py-20">Person not found</div>;

  // Movies — deduplicated, sorted by release_date desc
  const movies = (person.movie_credits?.cast ?? [])
    .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i)
    .sort((a: any, b: any) =>
      (b.release_date ?? '').localeCompare(a.release_date ?? '')
    );

  // TV Series — deduplicated, sorted by first_air_date desc
  const tvShows = (person.tv_credits?.cast ?? [])
    .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i)
    .sort((a: any, b: any) =>
      (b.first_air_date ?? '').localeCompare(a.first_air_date ?? '')
    );

  const activeList = tab === 'movies' ? movies : tvShows;

  return (
    <div className="pb-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-10">

          {/* ── Left: Photo + Personal Info ── */}
          <div className="w-full md:w-72 shrink-0">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={tmdb.getImageUrl(person.profile_path, 'original')}
                  alt={person.name}
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-bold text-sm border-b border-white/10 pb-2 uppercase tracking-wider text-white/50">
                  Personal Info
                </h3>

                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Known For</p>
                  <p className="text-sm">{person.known_for_department}</p>
                </div>

                {person.birthday && (
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Birthday</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-white/40 shrink-0" />
                      {person.birthday}
                      {person.deathday && <span className="text-white/40"> – {person.deathday}</span>}
                    </div>
                  </div>
                )}

                {person.place_of_birth && (
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Place of Birth</p>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" />
                      <span>{person.place_of_birth}</span>
                    </div>
                  </div>
                )}

                {person.also_known_as?.length > 0 && (
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Also Known As</p>
                    <div className="space-y-0.5">
                      {person.also_known_as.slice(0, 4).map((name: string, i: number) => (
                        <p key={i} className="text-xs text-white/60">{name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Bio + Filmography ── */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-black mb-1">{person.name}</h1>
            <p className="text-white/40 text-sm mb-8">{person.known_for_department}</p>

            {person.biography && (
              <section className="mb-12">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Biography
                </h2>
                <BiographyText text={person.biography} />
              </section>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-zinc-900 border border-white/10 rounded-xl p-1 w-fit">
              <button
                onClick={() => setTab('movies')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'movies'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Film className="h-4 w-4" />
                Movies
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'movies' ? 'bg-black/15 text-black' : 'bg-white/10 text-white/50'
                }`}>
                  {movies.length}
                </span>
              </button>
              <button
                onClick={() => setTab('tv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'tv'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Tv className="h-4 w-4" />
                TV Series
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'tv' ? 'bg-black/15 text-black' : 'bg-white/10 text-white/50'
                }`}>
                  {tvShows.length}
                </span>
              </button>
            </div>

            {/* Credit grid */}
            {activeList.length === 0 ? (
              <div className="py-16 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                No {tab === 'movies' ? 'movie' : 'TV'} credits found.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {activeList.map((item: any) => (
                  <div key={`${tab}-${item.id}`} className="flex flex-col gap-1.5">
                    <ContentCard
                      item={item}
                      type={tab === 'movies' ? 'movie' : 'tv'}
                    />
                    {/* Character + year below card */}
                    <div className="px-0.5">
                      {item.character && (
                        <p className="text-[11px] text-white/50 leading-tight line-clamp-1">
                          as {item.character}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-white/30">
                          {(tab === 'movies' ? item.release_date : item.first_air_date)?.split('-')[0] ?? '—'}
                        </span>
                        {item.vote_average > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-bold">
                            <Star className="h-2.5 w-2.5 fill-yellow-500" />
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Biography with expand/collapse ───────────────────────────────────────────
function BiographyText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 600;
  const displayed = isLong && !expanded ? text.slice(0, 600).trimEnd() + '…' : text;

  return (
    <div>
      <p className="text-white/70 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
        {displayed}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="mt-2 text-xs text-primary font-semibold hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
