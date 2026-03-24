import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { tmdb } from '@/src/services/tmdb';
import { ContentCard } from '@/src/components/cards/ContentCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/src/components/ui/table';
import { useEffect, useState } from 'react';
import { Bookmark, LayoutGrid, List, Star, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

type ViewMode = 'grid' | 'table';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  watching:      { label: 'Watching',      cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  completed:     { label: 'Completed',     cls: 'bg-green-500/15  text-green-400  border-green-500/20'  },
  plan_to_watch: { label: 'Plan to Watch', cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
  dropped:       { label: 'Dropped',       cls: 'bg-red-500/15    text-red-400    border-red-500/20'     },
};

export default function Watchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');

  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return [];
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user && !!supabase,
  });

  useEffect(() => {
    const fetchTMDBData = async () => {
      if (!watchlist) return;
      setLoading(true);
      const results = await Promise.all(
        watchlist.map(async (item: any) => {
          try {
            const data = item.content_type === 'movie'
              ? await tmdb.getMovieDetails(item.content_id)
              : await tmdb.getSeriesDetails(item.content_id);
            return {
              ...data,
              media_type: item.content_type,
              watchlist_status: item.status,
              watchlist_id: item.id,
            };
          } catch { return null; }
        })
      );
      setWatchlistData(results.filter(Boolean));
      setLoading(false);
    };
    fetchTMDBData();
  }, [watchlist]);

  const removeItem = useMutation({
    mutationFn: async (watchlistId: string) => {
      if (!supabase) throw new Error('No supabase');
      await supabase.from('watchlist').delete().eq('id', watchlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      toast.success('Removed from watchlist');
    },
    onError: () => toast.error('Failed to remove'),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <Bookmark className="h-16 w-16 text-white/20" />
        <h2 className="text-2xl font-bold">Sign in to view your Watchlist</h2>
        <p className="text-white/40 max-w-xs">Keep track of movies and shows you want to watch.</p>
        <Link to="/auth" className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  const renderContent = (status: string) => {
    const filtered = status === 'all'
      ? watchlistData
      : watchlistData.filter(item => item.watchlist_status === status);

    if (loading || watchlistLoading) {
      return view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Rating</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-14 w-10 rounded-lg shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-14 rounded-lg" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

    if (view === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} type={item.media_type} />
          ))}
        </div>
      );
    }

    // Table view
    return (
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Type</TableHead>
              <TableHead className="hidden md:table-cell w-36">Status</TableHead>
              <TableHead className="hidden md:table-cell w-24">Rating</TableHead>
              <TableHead className="w-24 text-right pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, idx) => {
              const title = item.title ?? item.name;
              const year = (item.release_date ?? item.first_air_date)?.split('-')[0];
              const badge = STATUS_BADGE[item.watchlist_status];
              const href = `/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.id}`;

              return (
                <TableRow key={item.id}>
                  {/* Index */}
                  <TableCell className="text-white/30 text-xs font-mono">{idx + 1}</TableCell>

                  {/* Poster + Title */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={tmdb.getImageUrl(item.poster_path, 'w500')}
                        alt={title}
                        className="h-14 w-10 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <Link to={href} className="font-semibold text-white hover:text-yellow-400 transition-colors line-clamp-1 text-sm">
                          {title}
                        </Link>
                        {year && <p className="text-[11px] text-white/30 mt-0.5">{year}</p>}
                      </div>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-white/50 capitalize">
                      {item.media_type === 'movie' ? 'Movie' : 'Series'}
                    </span>
                  </TableCell>

                  {/* Status badge */}
                  <TableCell className="hidden md:table-cell">
                    {badge && (
                      <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', badge.cls)}>
                        {badge.label}
                      </span>
                    )}
                  </TableCell>

                  {/* Rating */}
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400" />
                      {item.vote_average?.toFixed(1)}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={href}
                        className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="View"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-white/50" />
                      </Link>
                      <button
                        onClick={() => removeItem.mutate(item.watchlist_id)}
                        className="h-7 w-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors group"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white/50 group-hover:text-red-400" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black">Watchlist</h1>
          {!loading && (
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-bold text-white/60">
              {watchlistData.length}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-all', view === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-all', view === 'table' ? 'bg-white text-black' : 'text-white/40 hover:text-white')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="plan_to_watch">Plan to Watch</TabsTrigger>
          <TabsTrigger value="watching">Watching</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderContent('all')}</TabsContent>
        <TabsContent value="plan_to_watch">{renderContent('plan_to_watch')}</TabsContent>
        <TabsContent value="watching">{renderContent('watching')}</TabsContent>
        <TabsContent value="completed">{renderContent('completed')}</TabsContent>
      </Tabs>
    </div>
  );
}
