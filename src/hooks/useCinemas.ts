import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchNearbyCinemas, Cinema } from '../services/cinemas';
import { haversineKm } from '../utils/distance';
import { useRegion } from './useRegion';

const STALE = 1000 * 60 * 30;

export interface CinemaWithDistance extends Cinema {
  distanceKm: number;
}

export function useCinemas(radiusKm = 10) {
  const { coords, countryCode, locationDenied, setCity } = useRegion();
  const [manualCity, setManualCity] = useState('');

  const { data: cinemas = [], isLoading, error } = useQuery<CinemaWithDistance[]>({
    queryKey: ['cinemas', coords?.lat, coords?.lon, radiusKm],
    queryFn: async () => {
      const raw = await fetchNearbyCinemas(coords!.lat, coords!.lon, radiusKm);
      return raw
        .map((c) => ({
          ...c,
          distanceKm: haversineKm(coords!.lat, coords!.lon, c.lat, c.lon),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 10);
    },
    enabled: !!coords,
    staleTime: STALE,
    retry: 1,
  });

  const geocodeCity = async (city: string) => {
    await setCity(city);
  };

  return {
    cinemas,
    isLoading,
    error,
    coords,
    countryCode,
    locationDenied,
    manualCity,
    setManualCity,
    geocodeCity,
  };
}
