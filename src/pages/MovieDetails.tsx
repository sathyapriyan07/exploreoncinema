import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Button } from '@/src/components/ui/button';
import { Star, Plus, Check, MessageSquare, Sparkles, Film } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { StreamingProviders } from '@/src/components/StreamingProviders';
import { ContentCard } from '@/src/components/cards/ContentCard';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => tmdb.getMovieDetails(id!),
    enabled: !!id,
  });

  const { data: watchlistStatus } = useQuery({
    queryKey: ['watchlist', id, user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', id)
        .single();
      return data;
    },
    enabled: !!user && !!id && !!supabase,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('content_id', id)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!id && !!supabase,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      if (watchlistStatus) {
        await supabase.from('watchlist').delete().eq('id', watchlistStatus.id);
      } else {
        await supabase.from('watchlist').insert({
          user_id: user.id,
          content_id: id,
          content_type: 'movie',
          status: 'plan_to_watch',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', id, user?.id] });
      toast.success(watchlistStatus ? 'Removed from watchlist' : 'Added to watchlist');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      if (rating === 0) throw new Error('Please select a rating');
      await supabase.from('reviews').insert({
        user_id: user.id,
        content_id: id,
        content_type: 'movie',
        rating,
        review_text: reviewText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewText('');
      setRating(0);
      toast.success('Review submitted!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-[60vh] w-full rounded-3xl" /></div>;
  if (!movie) return <div className="text-center py-20">Movie not found</div>;

  return (
    <div className="pb-20 pt-20">
      {/* Hero — rounded rectangle */}
      <div className="px-4 md:px-8">
        <div className="relative w-full h-[220px] md:h-[360px] rounded-3xl overflow-hidden">
          <img
            src={tmdb.getImageUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
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
              src={tmdb.getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="rounded-2xl shadow-2xl border border-white/10 w-full"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-white pt-4 md:pt-4">
            <h1 className="text-4xl md:text-5xl font-black mb-2">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
              <span className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="h-4 w-4 fill-yellow-500" />
                {movie.vote_average.toFixed(1)}
              </span>
              <span>{movie.release_date?.split('-')[0]}</span>
              <span>{movie.runtime} min</span>
              <div className="flex gap-2">
                {movie.genres?.map((g: any) => (
                  <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-3xl">
              {movie.overview}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => toggleWatchlist.mutate()}
                variant={watchlistStatus ? "secondary" : "default"}
                className="rounded-full px-8"
              >
                {watchlistStatus ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {watchlistStatus ? "In Watchlist" : "Add to Watchlist"}
              </Button>
            </div>

            <StreamingProviders tmdbId={id!} type="movie" />
          </div>
        </div>

        {/* Cast */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Top Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {movie.credits?.cast?.slice(0, 10).map((person: any) => (
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

        {/* Similar Movies */}
        {movie.similar?.results?.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Film className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Similar Movies</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {movie.similar.results.slice(0, 15).map((item: any) => (
                <div key={item.id} className="w-[160px] sm:w-[200px] shrink-0">
                  <ContentCard item={item} type="movie" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {movie.recommendations?.results?.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">You Might Also Like</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {movie.recommendations.results.slice(0, 15).map((item: any) => (
                <div key={item.id} className="w-[160px] sm:w-[200px] shrink-0">
                  <ContentCard item={item} type="movie" />
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
              <div className="flex gap-2 mb-4">
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
                placeholder="What did you think of the movie?"
                className="w-full bg-zinc-800 border border-white/10 rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/50 min-h-[100px]"
              />
              <Button 
                onClick={() => submitReview.mutate()}
                className="mt-4 rounded-full"
                disabled={submitReview.isPending}
              >
                Submit Review
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
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {review.profiles?.name?.[0] || 'U'}
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
                <p className="text-white/80 text-sm leading-relaxed">
                  {review.review_text}
                </p>
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
