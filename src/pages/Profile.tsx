import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Star, MessageSquare, Bookmark, Play, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAvatar } from '@/src/components/UserAvatar';
import { generateRandomAvatar, getSeedFromUser } from '@/src/utils/avatar';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      return data;
    },
    enabled: !!user && !!supabase,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return [];
      const { data } = await supabase.from('reviews').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      return data;
    },
    enabled: !!user && !!supabase,
  });

  const { data: watchlistCount } = useQuery({
    queryKey: ['watchlistCount', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return 0;
      const { count } = await supabase.from('watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      return count ?? 0;
    },
    enabled: !!user && !!supabase,
  });

  const regenerateAvatar = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Not signed in');
      const seed = getSeedFromUser(profile?.name, user.email);
      const avatar_url = generateRandomAvatar(seed);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url })
        .eq('id', user.id);
      if (error) throw error;
      return avatar_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <h2 className="text-2xl font-bold">Sign in to view your profile</h2>
        <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
      </div>
    );
  }

  const displayName = profile?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      {/* Avatar + Info */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-5">
          <UserAvatar
            name={profile?.name}
            email={user.email}
            avatarUrl={profile?.avatar_url}
            size="xl"
            className="shadow-2xl"
          />
          <button
            onClick={() => regenerateAvatar.mutate()}
            disabled={regenerateAvatar.isPending}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            title="Generate new avatar"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-white/70 ${regenerateAvatar.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <h1 className="text-3xl font-black mb-1">{displayName}</h1>
        <p className="text-white/40 text-sm">{user.email}</p>
        <p className="text-white/30 text-xs mt-1">
          Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Shortcut Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-14">
        <Link
          to="/watchlist"
          className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/30 hover:bg-zinc-800 transition-all"
        >
          <Bookmark className="h-7 w-7 text-yellow-500" />
          <div className="text-center">
            <p className="font-bold text-lg">{watchlistCount ?? 0}</p>
            <p className="text-white/40 text-xs">Watchlist</p>
          </div>
        </Link>
        <Link
          to="/watchlist"
          className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/30 hover:bg-zinc-800 transition-all"
        >
          <Play className="h-7 w-7 text-yellow-500" />
          <div className="text-center">
            <p className="font-bold text-lg">{reviews?.length ?? 0}</p>
            <p className="text-white/40 text-xs">Reviews</p>
          </div>
        </Link>
      </div>

      {/* Reviews */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-yellow-500" />
          My Reviews
        </h2>

        <div className="space-y-4">
          {reviewsLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
            : reviews?.map((review: any) => (
                <div key={review.id} className="bg-zinc-900/60 rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold">
                        <Star className="h-3 w-3 fill-yellow-500" />
                        {review.rating}
                      </span>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">{review.content_type}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed italic">"{review.review_text}"</p>
                </div>
              ))}
          {!reviewsLoading && reviews?.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/30">No reviews yet.</p>
            </div>
          )}
        </div>

        <Button
          variant="destructive"
          className="w-full mt-12 rounded-full"
          onClick={() => { signOut(); navigate('/'); }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
