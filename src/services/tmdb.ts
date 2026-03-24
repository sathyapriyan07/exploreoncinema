const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) {
    throw new Error('TMDB API Key is missing');
  }

  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.statusText}`);
  }
  return response.json();
}

export const tmdb = {
  getTrending: (type: 'movie' | 'tv' | 'all' = 'all') => 
    fetchTMDB(`/trending/${type}/week`),
  
  getPopularMovies: () => 
    fetchTMDB('/movie/popular'),
  
  getPopularSeries: () => 
    fetchTMDB('/tv/popular'),
  
  getTopRatedMovies: () => 
    fetchTMDB('/movie/top_rated'),

  getTopRatedSeries: () =>
    fetchTMDB('/tv/top_rated'),

  getNowPlayingMovies: () =>
    fetchTMDB('/movie/now_playing'),

  getOnTheAirSeries: () =>
    fetchTMDB('/tv/on_the_air'),

  getUpcomingMovies: () =>
    fetchTMDB('/movie/upcoming'),

  getWatchProviders: (id: string, type: 'movie' | 'tv') =>
    fetchTMDB(`/${type}/${id}/watch/providers`),

  getMoviesByGenre: (genreId: string) =>
    fetchTMDB('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc' }),

  getMovieDetails: (id: string) => 
    fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,similar,recommendations,videos,images' }),

  getSeriesDetails: (id: string) => 
    fetchTMDB(`/tv/${id}`, { append_to_response: 'credits,similar,recommendations,videos,images' }),

  getSeasonDetails: (seriesId: string, seasonNumber: number) => 
    fetchTMDB(`/tv/${seriesId}/season/${seasonNumber}`),

  getEpisodeDetails: (seriesId: string, seasonNumber: number, episodeNumber: number) => 
    fetchTMDB(`/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`),

  getPersonDetails: (id: string) => 
    fetchTMDB(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits,images' }),

  search: (query: string, page = 1) => 
    fetchTMDB('/search/multi', { query, page: page.toString() }),

  searchMovies: (query: string, page = 1, params: Record<string, string> = {}) =>
    fetchTMDB('/search/movie', { query, page: page.toString(), ...params }),

  discoverMovies: (params: Record<string, string> = {}) =>
    fetchTMDB('/discover/movie', params),

  getMoviesByLanguage: (language: string, page = 1) =>
    fetchTMDB('/discover/movie', { 
      with_original_language: language, 
      sort_by: 'primary_release_date.desc',
      'primary_release_date.lte': new Date().toISOString().split('T')[0],
      page: page.toString() 
    }),

  getImageUrl: (path: string, size: 'w500' | 'w780' | 'original' = 'w500') => 
    path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://placehold.co/500x750/1a1a1a/666?text=No+Image',
};
