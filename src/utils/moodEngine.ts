export type Mood = 
  | 'happy' 
  | 'chill' 
  | 'thoughtful' 
  | 'romantic' 
  | 'emotional' 
  | 'intense' 
  | 'cozy' 
  | 'mystery' 
  | 'light-hearted' 
  | 'comfort';

export const MOOD_GENRES: Record<Mood, number[]> = {
  'happy': [35, 12], // Comedy, Adventure
  'chill': [18], // Drama (Slice of life)
  'thoughtful': [18, 36], // Drama, History (Biography)
  'romantic': [10749], // Romance
  'emotional': [18], // Drama
  'intense': [53, 28], // Thriller, Action
  'cozy': [10751, 16], // Family, Animation
  'mystery': [9648, 80], // Mystery, Crime
  'light-hearted': [35], // Comedy
  'comfort': [10749], // Romance (Feel-good)
};

export const MOOD_LABELS: Record<Mood, string> = {
  'happy': 'Perfect for a bright and happy day',
  'chill': 'Ideal for a relaxed and chill vibe',
  'thoughtful': 'Great for a thoughtful and reflective mood',
  'romantic': 'Something romantic for a rainy day',
  'emotional': 'A bit of drama for an emotional day',
  'intense': 'Intense movies for a stormy night',
  'cozy': 'Cozy up with these family favorites',
  'mystery': 'Unravel a mystery in the fog',
  'light-hearted': 'Keep it light-hearted in the heat',
  'comfort': 'Find comfort in these feel-good stories',
};

export function getMoodFromWeather(code: number, temp: number): Mood {
  // Extreme heat
  if (temp > 30) return 'light-hearted';
  
  // Cold
  if (temp < 10) return 'comfort';

  // Open-Meteo WMO Weather interpretation codes (WW)
  // 0: Clear sky
  if (code === 0) return 'happy';
  
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code >= 1 && code <= 3) return 'chill';
  
  // 45, 48: Fog and depositing rime fog
  if (code === 45 || code === 48) return 'mystery';
  
  // 51, 53, 55: Drizzle
  // 61, 63, 65: Rain
  // 80, 81, 82: Rain showers
  if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return Math.random() > 0.5 ? 'romantic' : 'emotional';
  }
  
  // 71, 73, 75: Snow fall
  // 77: Snow grains
  // 85, 86: Snow showers
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cozy';
  
  // 95, 96, 99: Thunderstorm
  if (code >= 95 && code <= 99) return 'intense';

  // Default
  return 'thoughtful';
}

export function getGenresFromMood(mood: Mood): number[] {
  return MOOD_GENRES[mood];
}
