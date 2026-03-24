import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Button } from '@/src/components/ui/button';
import { Star, Sparkles, Tv, MessageSquare, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { ContentCard } from '@/src/components/cards/ContentCard';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/src/components/ui/table';
import { StreamingProviders } from '@/src/components/StreamingProviders';

export default function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  const { data: series, isLoading } = useQuery({
    queryKey: ['series', id],
    queryFn: () => tmdb.getSeriesDetails(id!),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'tv', id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('content_id', id)
        .eq('content_type', 'series')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id && !!supabase,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      if (rating === 0) throw new Error('Please select a rating');
      await supabase.from('reviews').insert({
        user_id: user.id,
        content_id: id,
        content_type: 'series',
        rating,
        review_text: reviewText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'tv', id] });
      setReviewText('');
      setRating(0);
      toast.success('Review submitted!');
    },
    onError: (err: any) => toast.error(err.message),
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

            <StreamingProviders tmdbId={id!} type="tv" />
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

        {/* Reviews */}
        <section className="mt-16 max-w-4xl">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">User Reviews</h2>
          </div>

          {user ? (
            <div className="bg-zinc-900 rounded-2xl p-6 mb-12 border border-white/10">
              <h3 className="font-bold mb-4">Write a Review</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                      rating >= num ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think of this series?"
                className="w-full bg-zinc-800 border border-white/10 rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/50 min-h-[100px]"
              />
              <Button
                onClick={() => submitReview.mutate()}
                className="mt-4 rounded-full"
                disabled={submitReview.isPending}
              >
                {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-2xl p-8 text-center mb-12 border border-white/10">
              <p className="text-white/60 mb-4">Sign in to share your thoughts</p>
              <Link to="/auth">
                <Button variant="outline" className="rounded-full">Sign In</Button>
              </Link>
            </div>
          )}

          <div className="space-y-6">
            {reviews?.map((review: any) => (
              <div key={review.id} className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
                      {review.profiles?.avatar_url
                        ? <img src={review.profiles.avatar_url} alt={review.profiles.name} className="h-full w-full object-cover" />
                        : <UserCircle2 className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold">{review.profiles?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-white/40">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-bold">
                    <Star className="h-3 w-3 fill-yellow-500" />
                    {review.rating}
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{review.review_text}</p>
              </div>
            ))}
            {reviews?.length === 0 && (
              <p className="text-center text-white/40 py-8">No reviews yet. Be the first to write one!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SeasonEpisodes({ seriesId, seasonNumber }: { seriesId: string; seasonNumber: number }) {
  const { data: season, isLoading } = useQuery({
    queryKey: ['season', seriesId, seasonNumber],
    queryFn: () => tmdb.getSeasonDetails(seriesId, seasonNumber),
  });

  if (isLoading) return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Ep</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden sm:table-cell w-28">Air Date</TableHead>
            <TableHead className="w-20">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-24 rounded-lg shrink-0 hidden sm:block" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-10" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Ep</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden sm:table-cell w-28">Air Date</TableHead>
            <TableHead className="w-20">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {season?.episodes?.map((episode: any) => (
            <TableRow key={episode.id} className="cursor-pointer">
              {/* Episode number */}
              <TableCell>
                <span className="text-white/30 text-xs font-mono font-bold">
                  {String(episode.episode_number).padStart(2, '0')}
                </span>
              </TableCell>

              {/* Still + title + overview */}
              <TableCell>
                <Link
                  to={`/tv/${seriesId}/season/${seasonNumber}/episode/${episode.episode_number}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-24 shrink-0 aspect-video rounded-lg overflow-hidden hidden sm:block border border-white/10">
                    <img
                      src={tmdb.getImageUrl(episode.still_path)}
                      alt={episode.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white group-hover:text-yellow-400 transition-colors line-clamp-1">
                      {episode.name}
                    </p>
                    <p className="text-[11px] text-white/40 line-clamp-2 mt-0.5 leading-relaxed">
                      {episode.overview || 'No overview available.'}
                    </p>
                  </div>
                </Link>
              </TableCell>

              {/* Air date */}
              <TableCell className="hidden sm:table-cell">
                <span className="text-[11px] text-white/40">{episode.air_date}</span>
              </TableCell>

              {/* Rating */}
              <TableCell>
                {episode.vote_average > 0 ? (
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                    {episode.vote_average.toFixed(1)}
                  </div>
                ) : (
                  <span className="text-white/20 text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
