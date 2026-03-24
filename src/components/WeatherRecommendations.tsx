import { useRef } from 'react';
import { useWeatherRecommendations } from '../hooks/useWeatherRecommendations';
import { MOOD_LABELS, MOOD_GENRES, Mood, WEATHER_CONDITION } from '../utils/moodEngine';
import { ContentCard } from './cards/ContentCard';
import { Skeleton } from './ui/skeleton';
import {
  Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning,
  Thermometer, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

const MOOD_EMOJI: Record<Mood, string> = {
  'happy': '😄', 'chill': '😌', 'thoughtful': '🤔', 'romantic': '💕',
  'emotional': '😢', 'intense': '⚡', 'cozy': '🧸', 'mystery': '🔍',
  'light-hearted': '😂', 'comfort': '🫂',
};

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

const ALL_MOODS = Object.keys(MOOD_GENRES) as Mood[];

export function WeatherRecommendations() {
  const { mood, weather, recommendations, loading, manualMood, setManualMood } =
    useWeatherRecommendations();
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') =>
    rowRef.current?.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });

  const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode) : Thermometer;
  const condition = weather ? (WEATHER_CONDITION[weather.weatherCode] ?? 'Unknown') : null;

  return (
    <section className="pt-2 pb-6">
      {/* Header */}
      <div className="px-6 md:px-12 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Weather + Mood info */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <WeatherIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {weather && (
                  <span className="text-white font-bold text-base">
                    {Math.round(weather.temperature)}°C
                    {condition && <span className="text-white/50 font-normal text-sm ml-1">· {condition}</span>}
                  </span>
                )}
                {mood && (
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-bold border border-yellow-500/20">
                    {MOOD_EMOJI[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    {manualMood && (
                      <button
                        onClick={() => setManualMood(null)}
                        className="ml-1.5 opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3 inline" />
                      </button>
                    )}
                  </span>
                )}
              </div>
              {mood && (
                <p className="text-white/40 text-xs mt-0.5">{MOOD_LABELS[mood]}</p>
              )}
            </div>
          </div>

          {/* Scroll arrows (desktop) */}
          <div className="hidden md:flex gap-1 shrink-0">
            <button onClick={() => scroll('left')} className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll('right')} className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Manual mood selector */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 pb-1">
          {ALL_MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setManualMood(manualMood === m ? null : m)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                mood === m && manualMood === m
                  ? 'bg-yellow-500 text-black border-yellow-500'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {MOOD_EMOJI[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="px-6 md:px-12 mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          {mood ? `${MOOD_EMOJI[mood]} Picks for Your Mood` : 'Recommended for You'}
        </h2>
      </div>

      {/* Movie carousel */}
      <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-6 md:px-12">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-[130px] md:w-[160px] shrink-0 rounded-xl" />
            ))
          : recommendations.slice(0, 20).map((item: any) => (
              <div key={item.id} className="w-[130px] md:w-[160px] shrink-0">
                <ContentCard item={item} type="movie" />
              </div>
            ))}
      </div>
    </section>
  );
}
