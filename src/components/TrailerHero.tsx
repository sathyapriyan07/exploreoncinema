import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react';
import { tmdb } from '@/src/services/tmdb';

interface TrailerHeroProps {
  videos?: { results: any[] };
  backdrop_path: string;
  title: string;
  zoom?: number;
  logo?: string | null;
  onEnded?: () => void;
}

const QUALITIES = [
  { label: 'Auto', vq: '' },
  { label: '1080p', vq: 'hd1080' },
  { label: '720p', vq: 'hd720' },
  { label: '480p', vq: 'large' },
  { label: '360p', vq: 'medium' },
];

export function TrailerHero({ videos, backdrop_path, title, zoom = 1.15, logo, onEnded }: TrailerHeroProps) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [quality, setQuality] = useState(QUALITIES[0]);
  const [showQuality, setShowQuality] = useState(false);
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialLoad = useRef(true);

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

  const handleLoad = () => {
    if (initialLoad.current) {
      initialLoad.current = false;
      setTimeout(() => setReady(true), 1000);
      return;
    }
    setTimeout(() => {
      postCommand(muted ? 'mute' : 'unMute');
      postCommand(playing ? 'playVideo' : 'pauseVideo');
      setReady(true);
    }, 800);
  };

  useEffect(() => {
    if (initialLoad.current) return;
    postCommand(muted ? 'mute' : 'unMute');
  }, [muted]);

  useEffect(() => {
    if (initialLoad.current) return;
    postCommand(playing ? 'playVideo' : 'pauseVideo');
  }, [playing]);

  // Listen for YouTube player state 0 = ended
  useEffect(() => {
    if (!onEnded) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) onEnded();
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEnded]);

  const buildSrc = (vq: string) =>
    `https://www.youtube.com/embed/${trailer!.key}?autoplay=1&mute=1&loop=0&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}${vq ? `&vq=${vq}` : ''}`;

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
          {logo && (
            <div className="absolute bottom-5 left-6 md:left-10 z-20 pointer-events-none">
              <img src={logo} alt={title} className="h-8 md:h-12 w-auto object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8">
      <div className="relative w-full h-[220px] md:h-[420px] rounded-3xl overflow-hidden bg-black">
        {!ready && <div className="absolute inset-0 z-10 bg-black" />}
        <div className="absolute inset-0 overflow-hidden" style={{ scale: String(zoom) }}>
          <iframe
            ref={iframeRef}
            src={buildSrc(quality.vq)}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            onLoad={handleLoad}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none', pointerEvents: 'none' }}
            title={title}
          />
        </div>

        {/* Block iframe click-through */}
        <div className="absolute inset-0" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Logo — bottom left, small */}
        {logo && (
          <div className="absolute bottom-5 left-6 md:left-10 z-20 pointer-events-none">
            <img src={logo} alt={title} className="h-8 md:h-12 w-auto object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-end gap-2">

          {/* Quality popover */}
          <div className="relative">
            {showQuality && (
              <div className="absolute bottom-11 right-0 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden min-w-[90px]">
                {QUALITIES.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setReady(false);
                      setQuality(q);
                      setShowQuality(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10 ${
                      quality.label === q.label ? 'text-yellow-400' : 'text-white/80'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowQuality(s => !s)}
              className="h-9 px-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center gap-1.5 text-white hover:bg-black/80 transition-colors text-xs font-medium"
              aria-label="Quality"
            >
              <Settings className="h-3.5 w-3.5" />
              {quality.label}
            </button>
          </div>

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
