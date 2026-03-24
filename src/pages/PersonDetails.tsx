import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Star, Calendar, MapPin, User } from 'lucide-react';
import { ContentCard } from '@/src/components/cards/ContentCard';

export default function PersonDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: () => tmdb.getPersonDetails(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="h-[450px] w-full md:w-80 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );

  if (!person) return <div className="text-center py-20">Person not found</div>;

  const combinedCredits = [
    ...(person.movie_credits?.cast || []).map((c: any) => ({ ...c, media_type: 'movie' })),
    ...(person.tv_credits?.cast || []).map((c: any) => ({ ...c, media_type: 'tv' }))
  ]
    .filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.media_type === v.media_type)) === i)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <div className="pb-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column: Image & Info */}
          <div className="w-full md:w-80 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6">
                <img
                  src={tmdb.getImageUrl(person.profile_path, 'original')}
                  alt={person.name}
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg border-b border-white/10 pb-2">Personal Info</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Known For</p>
                    <p className="text-sm">{person.known_for_department}</p>
                  </div>

                  {person.birthday && (
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Birthday</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        {person.birthday}
                      </div>
                    </div>
                  )}

                  {person.place_of_birth && (
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Place of Birth</p>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        {person.place_of_birth}
                      </div>
                    </div>
                  )}

                  {person.also_known_as?.length > 0 && (
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Also Known As</p>
                      <div className="space-y-1">
                        {person.also_known_as.slice(0, 5).map((name: string, i: number) => (
                          <p key={i} className="text-xs text-white/60">{name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Credits */}
          <div className="flex-1">
            <h1 className="text-5xl font-black mb-2">{person.name}</h1>
            
            {person.biography && (
              <section className="mt-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Biography
                </h2>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {person.biography}
                </p>
              </section>
            )}

            {combinedCredits.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Known For
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {combinedCredits.slice(0, 12).map((item: any) => (
                    <ContentCard 
                      key={`${item.media_type}-${item.id}`} 
                      item={item} 
                      type={item.media_type as 'movie' | 'tv'} 
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
