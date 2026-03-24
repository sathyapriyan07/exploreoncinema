import { tmdb } from './tmdb';
import { getGenresFromMood, Mood } from '../utils/moodEngine';

export async function fetchRecommendationsByMood(mood: Mood) {
  const genreIds = getGenresFromMood(mood);
  const params = {
    with_genres: genreIds.join(','),
    sort_by: 'popularity.desc',
    'vote_count.gte': '100',
  };
  
  try {
    const response = await tmdb.discoverMovies(params);
    return response.results;
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    // Fallback to trending
    const trending = await tmdb.getTrending('movie');
    return trending.results;
  }
}
