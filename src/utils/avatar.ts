export type AvatarStyle = 'initials' | 'avataaars' | 'bottts' | 'pixel-art' | 'lorelei' | 'thumbs';

export interface AvatarStyleMeta {
  id: AvatarStyle;
  label: string;
  emoji: string;
  description: string;
  // Some styles don't support backgroundColor param
  supportsBackground: boolean;
}

export const AVATAR_STYLES: AvatarStyleMeta[] = [
  { id: 'initials',   label: 'Initials',  emoji: '🔤', description: 'Clean text avatar',      supportsBackground: true  },
  { id: 'avataaars',  label: 'Cartoon',   emoji: '🧑', description: 'Cartoon character',      supportsBackground: false },
  { id: 'bottts',     label: 'Robot',     emoji: '🤖', description: 'Retro robot style',      supportsBackground: true  },
  { id: 'pixel-art',  label: 'Pixel',     emoji: '👾', description: 'Retro pixel art',        supportsBackground: true  },
  { id: 'lorelei',    label: 'Lorelei',   emoji: '🧝', description: 'Modern illustration',    supportsBackground: false },
  { id: 'thumbs',     label: 'Thumbs',    emoji: '👍', description: 'Minimal thumb avatar',   supportsBackground: true  },
];

const BASE = 'https://api.dicebear.com/7.x';
const BG_COLORS = '1a1a2e,16213e,0f3460,533483';

export function generateAvatar(seed: string, style: AvatarStyle = 'initials'): string {
  const encoded = encodeURIComponent(seed.trim() || 'user');
  const meta = AVATAR_STYLES.find(s => s.id === style);
  const bgParam = meta?.supportsBackground ? `&backgroundColor=${BG_COLORS}` : '';
  return `${BASE}/${style}/svg?seed=${encoded}${bgParam}&radius=50`;
}

export function generateRandomAvatar(name: string, style: AvatarStyle = 'initials'): string {
  const seed = `${name}-${Date.now()}`;
  return generateAvatar(seed, style);
}

export function getSeedFromUser(name?: string | null, email?: string | null): string {
  if (name?.trim()) return name.trim();
  if (email) return email.split('@')[0];
  return 'user';
}
