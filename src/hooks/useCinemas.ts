import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { fetchNearbyCinemas, Cinema } from '../services/cinemas';
import { haversineKm } from '../utils/distance';

const STALE = 1000 * 60 * 30;
const LOC_KEY = 'np_user_coords';

export interface CinemaWithDistance extends Cinema {
  distanceKm: number;
}

function loadCachedCoords() {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const { lat, lon, ts } = JSON.parse(raw);
    if (Date.now() - ts < STALE) return { lat, lon };
  } catch {}
  return null;
}

function saveCoords(lat: number, lon: number) {
  localStorage.setItem(LOC_KEY, JSON.stringify({ lat, lon, ts: Date.now() }));
}

export function useCinemas(radiusKm = 10) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    loadCachedCoords
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualCity, setManualCity] = useState('');

  useEffect(() => {
    if (coords) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        saveCoords(c.lat, c.lon);
        setCoords(c);
      },
      () => setLocationDenied(true),
      { timeout: 8000 }
    );
  }, []);

  // Geocode manual city via Nominatim
  const geocodeCity = async (city: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data[0]) throw new Error('City not found');
    const c = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    saveCoords(c.lat, c.lon);
    setCoords(c);
    setLocationDenied(false);
  };

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

  return {
    cinemas,
    isLoading,
    error,
    coords,
    locationDenied,
    manualCity,
    setManualCity,
    geocodeCity,
  };
}
