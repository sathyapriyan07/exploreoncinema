import { useState, useEffect } from 'react';

const LOC_KEY = 'np_user_coords';
const CC_KEY = 'np_country_code';
const STALE = 1000 * 60 * 30;

export interface Coords { lat: number; lon: number; }

function loadCached(): Coords | null {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const { lat, lon, ts } = JSON.parse(raw);
    if (Date.now() - ts < STALE) return { lat, lon };
  } catch {}
  return null;
}

export async function resolveCountryCode(lat: number, lon: number): Promise<string> {
  const cached = localStorage.getItem(CC_KEY);
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const code = (data.address?.country_code as string)?.toUpperCase() ?? 'US';
    localStorage.setItem(CC_KEY, code);
    return code;
  } catch {
    return 'US';
  }
}

export async function geocodeCityToCoords(city: string): Promise<Coords> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data[0]) throw new Error('City not found');
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export function useRegion() {
  const [coords, setCoords] = useState<Coords | null>(loadCached);
  const [countryCode, setCountryCode] = useState<string>(
    () => localStorage.getItem(CC_KEY) ?? ''
  );
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (coords) {
      if (!countryCode)
        resolveCountryCode(coords.lat, coords.lon).then(setCountryCode);
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        const loc = { lat: c.latitude, lon: c.longitude };
        localStorage.setItem(LOC_KEY, JSON.stringify({ ...loc, ts: Date.now() }));
        setCoords(loc);
        resolveCountryCode(loc.lat, loc.lon).then(setCountryCode);
      },
      () => setLocationDenied(true),
      { timeout: 8000 }
    );
  }, []);

  const setCity = async (city: string) => {
    const loc = await geocodeCityToCoords(city);
    localStorage.setItem(LOC_KEY, JSON.stringify({ ...loc, ts: Date.now() }));
    localStorage.removeItem(CC_KEY);
    setCoords(loc);
    setLocationDenied(false);
    resolveCountryCode(loc.lat, loc.lon).then(setCountryCode);
  };

  return { coords, countryCode, locationDenied, setCity };
}
