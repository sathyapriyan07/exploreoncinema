import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Settings, RotateCcw, RotateCw, Captions, CaptionsOff } from 'lucide-react';
import { tmdb } from '@/src/services/tmdb';

interface TrailerHeroProps {
  videos?: { results: any[] };
  backdrop_path: string;
  title: string;
  zoom?: number;
  logo?: string | null;
  onEnded?: () => void;
  paused?: boolean;
  logoSize?: 'sm' | 'md';
  noPadding?: boolean;
}

const QUALITIES = [
  { label: 'Auto', vq: '' },
  { label: '1080p', vq: 'hd1080' },
  { label: '720p', vq: 'hd720' },
  { label: '480p', vq: 'large' },
  { label: '360p', vq: 'medium' },
];

export function TrailerHero({ videos, backdrop_path, title, zoom = 1.4, logo, onEnded, paused, logoSize = 'md', noPadding }: TrailerHeroProps) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [quality, setQuality] = useState(QUALITIES[0]);
  const [showQuality, setShowQuality] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [captions, setCaptions] = useState(false);
  const currentTime = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
      setTimeout(() => {
        postCommand('addEventListener', ['onStateChange']);
        setReady(true);
      }, 1000);
      return;
    }
    setTimeout(() => {
      postCommand('mute');
      postCommand(playing ? 'playVideo' : 'pauseVideo');
      postCommand('addEventListener', ['onStateChange']);
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

  useEffect(() => {
    if (initialLoad.current) return;
    const shouldPlay = playing && inView && !paused;
    postCommand(shouldPlay ? 'playVideo' : 'pauseVideo');
  }, [inView, paused]);

  // Track current time from YouTube infoDelivery
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info?.currentTime != null)
          currentTime.current = data.info.currentTime;
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) onEnded?.();
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEnded]);

  const seek = (delta: number) => postCommand('seekTo', [currentTime.current + delta, true]);

  const toggleCaptions = () => {
    if (captions) {
      postCommand('setOption', ['captions', 'track', {}]);
    } else {
      postCommand('setOption', ['captions', 'track', { languageCode: 'en' }]);
    }
    setCaptions(c => !c);
  };

  const buildSrc = (vq: string) =>
    `https://www.youtube.com/embed/${trailer!.key}?autoplay=1&mute=1&loop=0&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&cc_load_policy=0&origin=${encodeURIComponent(window.location.origin)}${vq ? `&vq=${vq}` : ''}`;

  if (!trailer) {
    return (
      <div ref={containerRef} className={noPadding ? '' : 'px-4 md:px-8'}>
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
              <img src={logo} alt={title} className={`${logoSize === 'sm' ? 'h-4 md:h-5' : 'h-5 md:h-7'} w-auto object-contain drop-shadow-2xl`} referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={noPadding ? '' : 'px-4 md:px-8'}>
      <div className="relative w-full h-[220px] md:h-[420px] rounded-3xl overflow-hidden bg-black">
        {!ready && <div className="absolute inset-0 z-10 bg-black" />}
        <div className="absolute inset-0 overflow-hidden" style={{ transform: `scale(${zoom})` }}>
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

        {/* Logo — bottom left, tiny */}
        {logo && (
          <div className="absolute bottom-5 left-6 md:left-10 z-20 pointer-events-none">
            <img src={logo} alt={title} className={`${logoSize === 'sm' ? 'h-4 md:h-5' : 'h-5 md:h-7'} w-auto object-contain drop-shadow-2xl`} referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">

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

          <button onClick={() => seek(-10)} className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors" aria-label="Rewind 10s">
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setPlaying(p => !p)}
            className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button onClick={() => seek(10)} className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors" aria-label="Forward 10s">
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMuted(m => !m)}
            className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleCaptions}
            className={`h-9 w-9 rounded-full backdrop-blur-sm border flex items-center justify-center transition-colors ${
              captions
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
            }`}
            aria-label={captions ? 'Disable subtitles' : 'Enable subtitles'}
          >
            {captions ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
