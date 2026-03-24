import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Loader2, AlertCircle, Play, Pause,
  Volume2, VolumeX, Maximize2, RotateCcw, RotateCw,
} from 'lucide-react';
import { getEmbedUrl, parsePlayerEvent, MediaType } from '@/src/services/player';

interface Props {
  id: number;
  type: MediaType;
  title: string;
  season?: number;
  episode?: number;
  onClose: () => void;
}

const STORAGE_KEY = (id: number, type: string, s?: number, e?: number) =>
  `vidking_progress_${type}_${id}${s != null ? `_s${s}e${e}` : ''}`;

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};

export function PlayerModal({ id, type, title, season, episode, onClose }: Props) {
  const storageKey = STORAGE_KEY(id, type, season, episode);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const embedUrl = getEmbedUrl(id, type, season, episode);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const post = useCallback((cmd: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const evt = parsePlayerEvent(e);
      if (!evt) return;
      if (evt.event === 'timeupdate') {
        setCurrentTime(evt.currentTime);
        setDuration(evt.duration);
        if (Math.floor(evt.currentTime) % 5 === 0)
          localStorage.setItem(storageKey, String(Math.floor(evt.currentTime)));
      }
      if (evt.event === 'play')  setPlaying(true);
      if (evt.event === 'pause') setPlaying(false);
      if (evt.event === 'ended') { setPlaying(false); localStorage.removeItem(storageKey); }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [storageKey]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showControls]);

  const togglePlay = () => { post({ action: playing ? 'pause' : 'play' }); setPlaying(p => !p); showControls(); };
  const toggleMute = () => { post({ action: muted ? 'unmute' : 'mute' }); setMuted(m => !m); showControls(); };
  const seekBy     = (delta: number) => { post({ action: 'seek', time: currentTime + delta }); showControls(); };
  const fullscreen = async () => {
    try {
      await wrapperRef.current?.requestFullscreen?.();
      await (screen.orientation as any)?.lock?.('landscape');
    } catch {}
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        (screen.orientation as any)?.unlock?.();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(true);
    setSeekValue(Number(e.target.value));
  };
  const handleSeekCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = (Number(e.target.value) / 100) * duration;
    post({ action: 'seek', time: t });
    setCurrentTime(t);
    setSeeking(false);
    showControls();
  };

  const displayProgress = seeking ? seekValue : progress;

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <div className="relative flex-1 overflow-hidden">

        {/* Loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black">
            <Loader2 className="h-10 w-10 text-white/30 animate-spin" />
            <p className="text-white/30 text-xs tracking-wide">Loading…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black px-4 text-center">
            <AlertCircle className="h-12 w-12 text-white/20" />
            <p className="text-white/40 text-sm">Stream unavailable for this title.</p>
          </div>
        )}

        {/* Vidking iframe */}
        {!error && (
          <iframe
            ref={iframeRef}
            key={embedUrl}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={title}
            style={{ border: 'none' }}
          />
        )}

        {/* Controls overlay */}
        {loaded && (
          <div
            className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Top — title + close */}
            <div className="flex items-center justify-between px-4 pt-4 pb-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-semibold text-sm truncate">{title}</span>
                {season != null && episode != null && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
                    S{season} · E{episode}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom — seek + buttons */}
            <div className="px-4 pb-4 pt-10 bg-gradient-to-t from-black/80 to-transparent">

              {/* Seek bar */}
              {duration > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-white/60 text-xs tabular-nums w-10 shrink-0">{fmt(currentTime)}</span>
                  <div className="relative flex-1 h-1">
                    <div className="absolute inset-0 rounded-full bg-white/20" />
                    <div
                      className="absolute left-0 top-0 h-full bg-white rounded-full pointer-events-none"
                      style={{ width: `${displayProgress}%` }}
                    />
                    <input
                      type="range" min={0} max={100} step={0.1}
                      value={displayProgress}
                      onChange={handleSeekChange}
                      onMouseUp={handleSeekCommit}
                      onTouchEnd={handleSeekCommit as any}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-white/60 text-xs tabular-nums w-10 shrink-0 text-right">{fmt(duration)}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => seekBy(-10)} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Rewind 10s">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button onClick={togglePlay} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors" aria-label={playing ? 'Pause' : 'Play'}>
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
                  </button>
                  <button onClick={() => seekBy(10)} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Forward 10s">
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button onClick={toggleMute} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label={muted ? 'Unmute' : 'Mute'}>
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
                <button onClick={fullscreen} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Fullscreen">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
