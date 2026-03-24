import { useQuery } from '@tanstack/react-query';
import { getCoordinates, fetchWeather, WeatherData } from '../services/weather';
import { getMoodFromWeather, Mood } from '../utils/moodEngine';
import { fetchRecommendationsByMood } from '../services/recommendation';
import { useState, useEffect } from 'react';

export function useWeatherRecommendations() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualMood, setManualMood] = useState<Mood | null>(null);

  useEffect(() => {
    getCoordinates()
      .then(setCoords)
      .catch((err) => {
        console.warn('Geolocation denied or failed:', err);
        // Fallback coordinates (e.g., London)
        setCoords({ latitude: 51.5074, longitude: -0.1278 });
      });
  }, []);

  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', coords?.latitude, coords?.longitude],
    queryFn: () => fetchWeather(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
  });

  const mood = manualMood || (weather ? getMoodFromWeather(weather.weatherCode, weather.temperature) : null);

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations', mood],
    queryFn: () => fetchRecommendationsByMood(mood!),
    enabled: !!mood,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    mood,
    weather,
    recommendations,
    loading: weatherLoading || recommendationsLoading,
    setManualMood,
  };
}
