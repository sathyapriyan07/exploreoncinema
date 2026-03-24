export interface Cinema {
  id: number;
  name: string;
  lat: number;
  lon: number;
  address?: string;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export async function fetchNearbyCinemas(
  lat: number,
  lon: number,
  radiusKm = 10
): Promise<Cinema[]> {
  const r = radiusKm * 1000;
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="cinema"](around:${r},${lat},${lon});
      way["amenity"="cinema"](around:${r},${lat},${lon});
    );
    out center tags;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return (data.elements as any[])
    .filter((el) => el.tags?.name)
    .map((el) => ({
      id: el.id,
      name: el.tags.name,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      address: [el.tags['addr:street'], el.tags['addr:city']]
        .filter(Boolean)
        .join(', ') || undefined,
    }))
    .filter((c) => c.lat != null && c.lon != null);
}
