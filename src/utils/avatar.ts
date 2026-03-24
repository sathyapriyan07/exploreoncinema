export type AvatarStyle = 'initials' | 'avataaars' | 'bottts' | 'pixel-art';

const BASE = 'https://api.dicebear.com/7.x';

export function generateAvatar(seed: string, style: AvatarStyle = 'initials'): string {
  const encoded = encodeURIComponent(seed.trim() || 'user');
  return `${BASE}/${style}/svg?seed=${encoded}&backgroundColor=1a1a2e,16213e,0f3460,533483&radius=50`;
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
