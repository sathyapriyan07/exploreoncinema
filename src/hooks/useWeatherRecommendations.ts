import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getCoordinates, fetchWeather } from '../services/weather';
import { getMoodFromWeather, Mood } from '../utils/moodEngine';
import { fetchRecommendationsByMood } from '../services/recommendation';

const STALE = 1000 * 60 * 30; // 30 min
// Fallback: London
const FALLBACK_COORDS = { latitude: 51.5074, longitude: -0.1278 };

export function useWeatherRecommendations() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualMood, setManualMood] = useState<Mood | null>(null);

  useEffect(() => {
    getCoordinates()
      .then(setCoords)
      .catch(() => setCoords(FALLBACK_COORDS));
  }, []);

  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', coords?.latitude, coords?.longitude],
    queryFn: () => fetchWeather(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: STALE,
    refetchInterval: STALE,
    retry: 1,
  });

  const derivedMood = weather
    ? getMoodFromWeather(weather.weatherCode, weather.temperature)
    : null;

  const mood = manualMood ?? derivedMood;

  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['weatherRecs', mood],
    queryFn: () => fetchRecommendationsByMood(mood!),
    enabled: !!mood,
    staleTime: STALE,
    retry: 1,
  });

  return {
    mood,
    weather,
    recommendations: recommendations ?? [],
    loading: weatherLoading || recsLoading,
    manualMood,
    setManualMood: (m: Mood | null) => setManualMood(m),
  };
}
