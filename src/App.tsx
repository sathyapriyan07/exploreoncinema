import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/src/components/ui/sonner';
import { AuthProvider } from '@/src/hooks/useAuth';
import { Layout } from '@/src/components/common/Layout';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('@/src/pages/Home'));
const Movies = lazy(() => import('@/src/pages/Movies'));
const TVShows = lazy(() => import('@/src/pages/TVShows'));
const MovieDetails = lazy(() => import('@/src/pages/MovieDetails'));
const SeriesDetails = lazy(() => import('@/src/pages/SeriesDetails'));
const EpisodeDetails = lazy(() => import('@/src/pages/EpisodeDetails'));
const PersonDetails = lazy(() => import('@/src/pages/PersonDetails'));
const Search = lazy(() => import('@/src/pages/Search'));
const Profile = lazy(() => import('@/src/pages/Profile'));
const Watchlist = lazy(() => import('@/src/pages/Watchlist'));
const Auth = lazy(() => import('@/src/pages/Auth'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Layout>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/tv/:id" element={<SeriesDetails />} />
              <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<EpisodeDetails />} />
              <Route path="/person/:id" element={<PersonDetails />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
            </Suspense>
          </Layout>
          <Toaster position="top-center" theme="dark" richColors />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
