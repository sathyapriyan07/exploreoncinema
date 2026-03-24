import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tmdb } from '@/src/services/tmdb';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Button } from '@/src/components/ui/button';
import { Star, ChevronLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EpisodeDetails() {
  const { id, seasonNumber, episodeNumber } = useParams<{ id: string; seasonNumber: string; episodeNumber: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  const contentId = `tv-${id}-s${seasonNumber}-e${episodeNumber}`;

  const { data: episode, isLoading } = useQuery({
    queryKey: ['episode', id, seasonNumber, episodeNumber],
    queryFn: () => tmdb.getEpisodeDetails(id!, parseInt(seasonNumber!), parseInt(episodeNumber!)),
    enabled: !!id && !!seasonNumber && !!episodeNumber,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', contentId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!supabase,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Please sign in first');
      if (rating === 0) throw new Error('Please select a rating');
      await supabase.from('reviews').insert({
        user_id: user.id,
        content_id: contentId,
        content_type: 'episode',
        rating,
        review_text: reviewText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', contentId] });
      setReviewText('');
      setRating(0);
      toast.success('Review submitted!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-[50vh] w-full rounded-3xl" /></div>;
  if (!episode) return <div className="text-center py-20">Episode not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        to={`/tv/${id}`}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-primary transition-colors mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Series
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
          <img
            src={tmdb.getImageUrl(episode.still_path, 'original')}
            alt={episode.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-white">
          <div className="flex items-center gap-4 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
              Season {seasonNumber} • Episode {episodeNumber}
            </span>
            <span className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
              <Star className="h-4 w-4 fill-yellow-500" />
              {episode.vote_average.toFixed(1)}
            </span>
          </div>
          <h1 className="text-4xl font-black mb-4">{episode.name}</h1>
          <p className="text-white/40 text-sm mb-6">Aired on {episode.air_date}</p>
          <p className="text-lg text-white/80 leading-relaxed">
            {episode.overview || 'No overview available for this episode.'}
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-20 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Episode Reviews</h2>
        </div>

        {user ? (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-12 border border-white/10">
            <h3 className="font-bold mb-4">Rate this Episode</h3>
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
              placeholder="What did you think of this episode?"
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
            <p className="text-white/60 mb-4">Sign in to review this episode</p>
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
        </div>
      </section>
    </div>
  );
}
