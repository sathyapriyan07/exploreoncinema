import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  const { user } = useAuth();
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return [];
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!user && !!supabase,
  });

  useEffect(() => {
    const fetchTMDBData = async () => {
      if (!watchlist) return;
      setLoading(true);
      const results = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const data = item.content_type === 'movie'
              ? await tmdb.getMovieDetails(item.content_id)
              : await tmdb.getSeriesDetails(item.content_id);
            return { ...data, media_type: item.content_type, watchlist_status: item.status };
          } catch { return null; }
        })
      );
      setWatchlistData(results.filter(Boolean));
      setLoading(false);
    };
    fetchTMDBData();
  }, [watchlist]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <Bookmark className="h-16 w-16 text-white/20" />
        <h2 className="text-2xl font-bold">Sign in to view your Watchlist</h2>
        <p className="text-white/40 max-w-xs">Keep track of movies and shows you want to watch.</p>
        <Link
          to="/auth"
          className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const renderGrid = (status: string) => {
    const filtered = status === 'all'
      ? watchlistData
      : watchlistData.filter(item => item.watchlist_status === status);

    if (loading || watchlistLoading) {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Bookmark className="h-12 w-12 text-white/20" />
          <p className="text-white/40">Nothing here yet. Start adding titles!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((item) => (
          <ContentCard key={item.id} item={item} type={item.media_type} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-black">Watchlist</h1>
        {!loading && (
          <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-bold text-white/60">
            {watchlistData.length}
          </span>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="plan_to_watch">Plan to Watch</TabsTrigger>
          <TabsTrigger value="watching">Watching</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderGrid('all')}</TabsContent>
        <TabsContent value="plan_to_watch">{renderGrid('plan_to_watch')}</TabsContent>
        <TabsContent value="watching">{renderGrid('watching')}</TabsContent>
        <TabsContent value="completed">{renderGrid('completed')}</TabsContent>
      </Tabs>
    </div>
  );
}
