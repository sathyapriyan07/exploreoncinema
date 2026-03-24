/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  runtime?: number;
  genres?: { id: number; name: string }[];
}

export interface TVSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
}

export interface Season {
  id: number;
  air_date: string;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  air_date: string;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string;
  season_number: number;
  vote_average: number;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface Review {
  id: string;
  user_id: string;
  content_type: 'movie' | 'series' | 'episode';
  content_id: string;
  rating: number;
  review_text: string;
  is_spoiler: boolean;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string;
  };
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  content_type: 'movie' | 'series';
  content_id: string;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped';
  created_at: string;
  // We'll fetch TMDB data separately or store minimal info
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  created_at: string;
}
