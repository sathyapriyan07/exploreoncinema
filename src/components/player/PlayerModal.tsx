import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { PLAYER_SOURCES, getEmbedUrl, MediaType } from '@/src/services/player';

interface Props {
  id: number;
  type: MediaType;
  title: string;
  season?: number;
  episode?: number;
  onClose: () => void;
}

export function PlayerModal({ id, type, title, season, episode, onClose }: Props) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const embedUrl = getEmbedUrl(id, type, sourceIdx, season, episode);

  const handleSourceChange = (idx: number) => {
    setSourceIdx(idx);
    setLoaded(false);
    setError(false);
  };

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

  // Reset loaded state when source changes
  useEffect(() => { setLoaded(false); setError(false); }, [sourceIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-semibold text-sm truncate">{title}</span>
          {season != null && episode != null && (
            <span className="text-white/40 text-xs shrink-0">S{season} E{episode}</span>
          )}
        </div>

        {/* Source selector */}
        <div className="flex items-center gap-2 mx-4">
          {PLAYER_SOURCES.map((src, i) => (
            <button
              key={src.label}
              onClick={() => handleSourceChange(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                i === sourceIdx
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleClose}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
          aria-label="Close player"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Player area */}
      <div className="relative flex-1 bg-black">
        {/* Spinner */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <AlertCircle className="h-12 w-12 text-white/30" />
            <p className="text-white/50 text-sm">Stream unavailable. Try another server.</p>
            <div className="flex gap-2">
              {PLAYER_SOURCES.map((src, i) => i !== sourceIdx && (
                <button
                  key={src.label}
                  onClick={() => handleSourceChange(i)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                >
                  Try {src.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* iframe — only mounted when not in error */}
        {!error && (
          <iframe
            key={`${sourceIdx}-${id}`}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={title}
            style={{ border: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
