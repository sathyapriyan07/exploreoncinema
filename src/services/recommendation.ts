import { tmdb } from './tmdb';
import { getGenresFromMood, Mood } from '../utils/moodEngine';

export async function fetchRecommendationsByMood(mood: Mood): Promise<any[]> {
  const genreIds = getGenresFromMood(mood);
  try {
    const res = await tmdb.discoverMovies({
      with_genres: genreIds.join(','),
      sort_by: 'popularity.desc',
      'vote_count.gte': '200',
    });
    if (res.results?.length) return res.results;
    throw new Error('Empty results');
  } catch {
    try {
      const fallback = await tmdb.getTrending('movie');
      return fallback.results ?? [];
    } catch {
      return [];
    }
  }
}
