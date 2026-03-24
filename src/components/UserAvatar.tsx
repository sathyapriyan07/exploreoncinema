import { useState } from 'react';
import { AvatarStyle, generateAvatar, getSeedFromUser } from '@/src/utils/avatar';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  avatarStyle?: AvatarStyle | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-28 w-28',
};

export function UserAvatar({
  name,
  email,
  avatarUrl,
  avatarStyle = 'initials',
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const seed = getSeedFromUser(name, email);
  const fallbackUrl = generateAvatar(seed, avatarStyle ?? 'initials');
  const src = avatarUrl || fallbackUrl;
  const [errored, setErrored] = useState(false);

  return (
    <img
      src={errored ? fallbackUrl : src}
      alt={name || email || 'User avatar'}
      onError={() => setErrored(true)}
      className={`rounded-full object-cover border border-white/10 ${SIZE_MAP[size]} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
