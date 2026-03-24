import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/src/components/ui/sonner';
import { AuthProvider } from '@/src/hooks/useAuth';
import { Layout } from '@/src/components/common/Layout';
import Home from '@/src/pages/Home';
import Movies from '@/src/pages/Movies';
import TVShows from '@/src/pages/TVShows';
import MovieDetails from '@/src/pages/MovieDetails';
import SeriesDetails from '@/src/pages/SeriesDetails';
import EpisodeDetails from '@/src/pages/EpisodeDetails';
import PersonDetails from '@/src/pages/PersonDetails';
import Search from '@/src/pages/Search';
import Profile from '@/src/pages/Profile';
import Watchlist from '@/src/pages/Watchlist';
import Auth from '@/src/pages/Auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Layout>
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
          </Layout>
          <Toaster position="top-center" theme="dark" richColors />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
