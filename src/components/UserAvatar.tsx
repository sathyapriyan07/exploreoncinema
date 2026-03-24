import { useState } from 'react';
import { generateAvatar, getSeedFromUser } from '@/src/utils/avatar';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm:  'h-8 w-8 text-xs',
  md:  'h-10 w-10 text-sm',
  lg:  'h-16 w-16 text-xl',
  xl:  'h-28 w-28 text-4xl',
};

export function UserAvatar({ name, email, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const seed = getSeedFromUser(name, email);
  const fallbackUrl = generateAvatar(seed);
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
