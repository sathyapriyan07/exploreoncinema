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

export const MOOD_LABELS: Record<Mood, string> = {
  'happy':        'Perfect for a bright and happy day ☀️',
  'chill':        'Ideal for a relaxed and chill vibe 🌤️',
  'thoughtful':   'Great for a thoughtful and reflective mood 🌥️',
  'romantic':     'Something romantic for a rainy day 🌧️',
  'emotional':    'A bit of drama for an emotional day 🌦️',
  'intense':      'Intense picks for a stormy night ⛈️',
  'cozy':         'Cozy up with these snowy-day favorites ❄️',
  'mystery':      'Unravel a mystery in the fog 🌫️',
  'light-hearted':'Keep it light-hearted in the heat 🌡️',
  'comfort':      'Find comfort in these feel-good stories 🧣',
};

export const MOOD_GENRES: Record<Mood, number[]> = {
  'happy':        [35, 12],    // Comedy, Adventure
  'chill':        [18, 10749], // Drama, Romance
  'thoughtful':   [18, 36],    // Drama, History
  'romantic':     [10749, 35], // Romance, Comedy
  'emotional':    [18, 10402], // Drama, Music
  'intense':      [53, 28],    // Thriller, Action
  'cozy':         [10751, 16], // Family, Animation
  'mystery':      [9648, 80],  // Mystery, Crime
  'light-hearted':[35, 10751], // Comedy, Family
  'comfort':      [10749, 18], // Romance, Drama
};

export const WEATHER_CONDITION: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export function getMoodFromWeather(code: number, temp: number): Mood {
  if (temp > 32) return 'light-hearted';
  if (temp < 8)  return 'comfort';
  if (code === 0) return 'happy';
  if (code >= 1 && code <= 2) return 'chill';
  if (code === 3) return 'thoughtful';
  if (code === 45 || code === 48) return 'mystery';
  if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return code % 2 === 0 ? 'romantic' : 'emotional';
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cozy';
  if (code >= 95) return 'intense';
  return 'thoughtful';
}

export function getGenresFromMood(mood: Mood): number[] {
  return MOOD_GENRES[mood];
}
