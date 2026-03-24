import {
  Star, Bookmark, Search, Play,
  MapPin, Clock, MessageSquare, Heart, Plus, Check,
  ChevronLeft, ChevronRight, X, Home, Film, Tv,
  User, LogOut, ExternalLink, Sparkles, Info,
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Thermometer, Wind, Droplets, Eye, Smile, Frown,
  Music, Zap, Coffee, Moon, Laugh, Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Mood icons — lucide equivalents for each mood
export const MOOD_ICONS: Record<string, LucideIcon> = {
  happy:          Sun,
  chill:          Coffee,
  thoughtful:     Eye,
  romantic:       Heart,
  emotional:      Droplets,
  intense:        Zap,
  cozy:           Moon,
  mystery:        Eye,
  'light-hearted': Laugh,
  comfort:        Users,
};

const SIZE_MAP = {
  xs:  'h-3 w-3',
  sm:  'h-4 w-4',
  md:  'h-5 w-5',
  lg:  'h-6 w-6',
  xl:  'h-7 w-7',
  '2xl': 'h-8 w-8',
} as const;

type IconSize = keyof typeof SIZE_MAP;

const ICON_MAP = {
  star:         Star,
  bookmark:     Bookmark,
  search:       Search,
  play:         Play,
  'map-pin':    MapPin,
  clock:        Clock,
  comment:      MessageSquare,
  heart:        Heart,
  plus:         Plus,
  check:        Check,
  'chevron-left':  ChevronLeft,
  'chevron-right': ChevronRight,
  close:        X,
  home:         Home,
  film:         Film,
  tv:           Tv,
  user:         User,
  logout:       LogOut,
  external:     ExternalLink,
  sparkles:     Sparkles,
  info:         Info,
  sun:          Sun,
  cloud:        Cloud,
  rain:         CloudRain,
  snow:         CloudSnow,
  lightning:    CloudLightning,
  fog:          CloudFog,
  thermometer:  Thermometer,
  wind:         Wind,
  smile:        Smile,
  frown:        Frown,
  music:        Music,
  zap:          Zap,
  coffee:       Coffee,
  moon:         Moon,
  laugh:        Laugh,
  users:        Users,
  eye:          Eye,
  droplets:     Droplets,
} as const;

type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  'aria-label'?: string;
  filled?: boolean;
}

export function Icon({ name, size = 'md', className, 'aria-label': ariaLabel, filled }: IconProps) {
  const Component = ICON_MAP[name] ?? Star;
  return (
    <Component
      className={cn(SIZE_MAP[size], className, filled && 'fill-current')}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
}

// Re-export for direct use
export { SIZE_MAP, type IconName, type IconSize, type LucideIcon };
