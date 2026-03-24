export type MediaType = 'movie' | 'tv';

const BASE = 'https://www.vidking.net/embed';
const COLOR = '000000'; // set to black to hide Vidking's default color accent

export interface VidkingOptions {
  autoPlay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  progress?: number; // resume from seconds
}

export const getEmbedUrl = (
  id: number,
  type: MediaType,
  options: VidkingOptions = {},
  season?: number,
  episode?: number
): string => {
  const path =
    type === 'tv' && season != null && episode != null
      ? `${BASE}/tv/${id}/${season}/${episode}`
      : `${BASE}/movie/${id}`;

  const params = new URLSearchParams({ color: COLOR });
  if (options.autoPlay)        params.set('autoPlay', 'true');
  if (options.nextEpisode)     params.set('nextEpisode', 'true');
  if (options.episodeSelector) params.set('episodeSelector', 'true');
  if (options.progress != null && options.progress > 0)
    params.set('progress', String(Math.floor(options.progress)));

  return `${path}?${params.toString()}`;
};

// Shape of progress events sent by Vidking player
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
