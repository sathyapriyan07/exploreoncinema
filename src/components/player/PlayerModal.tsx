import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, AlertCircle, Maximize2 } from 'lucide-react';
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

export function PlayerModal({ id, type, title, season, episode, onClose }: Props) {
  const storageKey = STORAGE_KEY(id, type, season, episode);
  const savedProgress = Number(localStorage.getItem(storageKey) ?? 0);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);       // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = getEmbedUrl(
    id, type,
    { autoPlay: true, nextEpisode: type === 'tv', episodeSelector: type === 'tv', progress: savedProgress },
    season, episode
  );

  const handleClose = useCallback(() => onClose(), [onClose]);

  // ESC + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  // Listen to Vidking progress events
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const evt = parsePlayerEvent(e);
      if (!evt) return;
      if (evt.event === 'timeupdate') {
        setCurrentTime(evt.currentTime);
        setDuration(evt.duration);
        setProgress(evt.progress);
        // Persist every 5 s
        if (Math.floor(evt.currentTime) % 5 === 0)
          localStorage.setItem(storageKey, String(Math.floor(evt.currentTime)));
      }
      if (evt.event === 'ended') localStorage.removeItem(storageKey);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [storageKey]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-semibold text-sm truncate">{title}</span>
          {season != null && episode != null && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
              S{season} · E{episode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Fullscreen shortcut */}
          <button
            onClick={() => iframeRef.current?.requestFullscreen?.()}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Player ── */}
      <div className="relative flex-1 bg-black overflow-hidden">

        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="h-10 w-10 text-white/30 animate-spin" />
            <p className="text-white/30 text-xs">Loading player…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-4 text-center">
            <AlertCircle className="h-12 w-12 text-white/20" />
            <p className="text-white/40 text-sm">Stream unavailable for this title.</p>
          </div>
        )}

        {!error && (
          <iframe
            ref={iframeRef}
            key={embedUrl}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={title}
            style={{ border: 'none' }}
          />
        )}
      </div>

      {/* ── Progress bar ── */}
      {loaded && duration > 0 && (
        <div className="shrink-0 px-4 py-2 bg-black/80 border-t border-white/10 flex items-center gap-3">
          <span className="text-white/40 text-xs tabular-nums w-10 shrink-0">{fmt(currentTime)}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e50914] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-white/40 text-xs tabular-nums w-10 shrink-0 text-right">{fmt(duration)}</span>
        </div>
      )}
    </div>
  );
}
