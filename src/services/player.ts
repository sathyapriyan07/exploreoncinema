export type MediaType = 'movie' | 'tv';

const BASE = 'https://www.vidking.net/embed';

export const getEmbedUrl = (
  id: number,
  type: MediaType,
  season?: number,
  episode?: number
): string => {
  if (type === 'tv' && season != null && episode != null)
    return `${BASE}/tv/${id}/${season}/${episode}`;
  return `${BASE}/movie/${id}`;
};

export interface VidkingEvent {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked';
  currentTime: number;
  duration: number;
  progress: number;
  id: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  timestamp: number;
}

export const parsePlayerEvent = (raw: MessageEvent): VidkingEvent | null => {
  try {
    const msg = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
    if (msg?.type === 'PLAYER_EVENT' && msg?.data?.event) return msg.data as VidkingEvent;
  } catch {}
  return null;
};
