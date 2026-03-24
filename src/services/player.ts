export type MediaType = 'movie' | 'tv';

export interface PlayerSource {
  label: string;
  getUrl: (id: number, season?: number, episode?: number) => string;
}

export const PLAYER_SOURCES: PlayerSource[] = [
  {
    label: 'Server 1',
    getUrl: (id, season, episode) =>
      season != null && episode != null
        ? `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
  },
  {
    label: 'Server 2',
    getUrl: (id, season, episode) =>
      season != null && episode != null
        ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
        : `https://embed.su/embed/movie/${id}`,
  },
  {
    label: 'Server 3',
    getUrl: (id, season, episode) =>
      season != null && episode != null
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
];

export const getEmbedUrl = (
  id: number,
  type: MediaType,
  sourceIndex = 0,
  season?: number,
  episode?: number
): string => {
  const source = PLAYER_SOURCES[sourceIndex] ?? PLAYER_SOURCES[0];
  return type === 'tv'
    ? source.getUrl(id, season, episode)
    : source.getUrl(id);
};
