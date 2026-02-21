import { getDefaultAvatarUrl } from '@/lib/avatars';

type AvatarProps = {
  avatarId?: number | null;
  src?: string | null;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ avatarId, src, displayName, size = 'md', className = '' }: AvatarProps) {
  const url = src ?? (avatarId ? getDefaultAvatarUrl(avatarId) : null);
  const initial = displayName?.trim().slice(0, 1).toUpperCase() || '?';
  const sizeClass = sizeClasses[size];

  if (url) {
    return (
      <img
        src={url}
        alt={displayName ? `${displayName} avatar` : 'Avatar'}
        className={`rounded-full object-cover bg-muted ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
