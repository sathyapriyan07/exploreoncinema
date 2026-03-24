export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

export async function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000 }
    );
  });
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  );
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();
  return {
    temperature: data.current_weather.temperature,
    weatherCode: data.current_weather.weathercode,
    isDay: data.current_weather.is_day === 1,
  };
}
