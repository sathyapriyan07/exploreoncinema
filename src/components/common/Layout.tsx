import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Film, Tv, Search, User, Bookmark, LogOut } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { tmdb } from '@/src/services/tmdb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase';
import { UserAvatar } from '@/src/components/UserAvatar';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/tv-shows', label: 'TV Shows' },
  { to: '/search', label: 'Search' },
];

const BOTTOM_NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/movies', icon: Film, label: 'Movies' },
  { to: '/tv-shows', icon: Tv, label: 'TV Shows' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;
      const { data } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
      return data;
    },
    enabled: !!user && !!supabase,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-500 selection:text-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
              <Film className="h-4 w-4 text-black" />
            </div>
            <span className="font-display text-lg font-black tracking-widest text-white uppercase">
              SceneFinds
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Search icon + Auth */}
        <div className="flex items-center gap-3">
          <Link
            to="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-white" />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <UserAvatar
                  name={profile?.name}
                  email={user.email}
                  avatarUrl={profile?.avatar_url}
                  size="sm"
                  className="hover:ring-2 hover:ring-white/30 transition-all"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-900 text-white border-white/10">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/watchlist')} className="cursor-pointer">
                  <Bookmark className="mr-2 h-4 w-4" /> Watchlist
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { signOut(); navigate('/'); }}
                  className="cursor-pointer text-red-400 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="h-9 px-5 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="pb-16 md:pb-0">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10" id="bottom-nav">
        <div className="flex items-center justify-around py-2">
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                  active ? 'text-white' : 'text-white/40'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
