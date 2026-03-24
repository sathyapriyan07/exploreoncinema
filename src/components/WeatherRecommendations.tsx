import { useWeatherRecommendations } from '../hooks/useWeatherRecommendations';
import { MOOD_LABELS, Mood } from '../utils/moodEngine';
import { ContentCard } from './cards/ContentCard';
import { Skeleton } from './ui/skeleton';
import { 
  Cloud, 
  CloudFog, 
  CloudLightning, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  Thermometer,
  Smile,
  Coffee,
  Heart,
  Zap,
  Search,
  Flame,
  Snowflake,
  Wind
} from 'lucide-react';
import { motion } from 'framer-motion';

const moodIcons: Record<Mood, any> = {
  'happy': Smile,
  'chill': Coffee,
  'thoughtful': Search,
  'romantic': Heart,
  'emotional': Wind,
  'intense': Zap,
  'cozy': Snowflake,
  'mystery': CloudFog,
  'light-hearted': Flame,
  'comfort': Coffee,
};

const weatherIcons: Record<number, any> = {
  0: Sun,
  1: Sun,
  2: Cloud,
  3: Cloud,
  45: CloudFog,
  48: CloudFog,
  51: CloudRain,
  53: CloudRain,
  55: CloudRain,
  61: CloudRain,
  63: CloudRain,
  65: CloudRain,
  71: CloudSnow,
  73: CloudSnow,
  75: CloudSnow,
  77: CloudSnow,
  80: CloudRain,
  81: CloudRain,
  82: CloudRain,
  85: CloudSnow,
  86: CloudSnow,
  95: CloudLightning,
  96: CloudLightning,
  99: CloudLightning,
};

export function WeatherRecommendations() {
  const { mood, weather, recommendations, loading, setManualMood } = useWeatherRecommendations();

  const WeatherIcon = weather ? (weatherIcons[weather.weatherCode] || Cloud) : Cloud;
  const MoodIcon = mood ? (moodIcons[mood] || Smile) : Smile;

  if (loading && !recommendations) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-[160px] sm:w-[200px] shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <WeatherIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
              </span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <MoodIcon className="w-4 h-4" />
                <span>{mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Mood'}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {mood ? MOOD_LABELS[mood] : 'Fetching recommendations...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {(Object.keys(MOOD_LABELS) as Mood[]).map((m) => (
            <button
              key={m}
              onClick={() => setManualMood(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                mood === m 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {recommendations?.map((item: any) => (
          <motion.div 
            key={item.id} 
            className="w-[160px] sm:w-[200px] shrink-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ContentCard item={item} type="movie" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
