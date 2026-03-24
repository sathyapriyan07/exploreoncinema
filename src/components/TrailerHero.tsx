import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { tmdb } from '@/src/services/tmdb';

interface TrailerHeroProps {
  videos?: { results: any[] };
  backdrop_path: string;
  title: string;
}

export function TrailerHero({ videos, backdrop_path, title }: TrailerHeroProps) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const trailer =
    videos?.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
    videos?.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ??
    videos?.results?.find((v: any) => v.site === 'YouTube');

  const postCommand = (func: string, args: any[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  // Sync mute state via postMessage — no remount
  useEffect(() => {
    postCommand(muted ? 'mute' : 'unMute');
  }, [muted]);

  // Sync play/pause state via postMessage — no remount
  useEffect(() => {
    postCommand(playing ? 'playVideo' : 'pauseVideo');
  }, [playing]);

  if (!trailer) {
    return (
      <div className="px-4 md:px-8">
        <div className="relative w-full h-[220px] md:h-[420px] rounded-3xl overflow-hidden bg-black">
          <img
            src={tmdb.getImageUrl(backdrop_path, 'original')}
            alt={title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8">
      <div className="relative w-full h-[220px] md:h-[420px] rounded-3xl overflow-hidden bg-black">
        {/* enablejsapi=1 required for postMessage commands */}
        <div className="absolute inset-0 scale-[1.15] overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none', pointerEvents: 'none' }}
            title={title}
          />
        </div>

        {/* Block iframe click-through */}
        <div className="absolute inset-0" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setPlaying(p => !p)}
            className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMuted(m => !m)}
            className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
