import { cn } from '@/lib/utils';

interface BeHalixLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
};

export function BeHalixLogo({ size = 'md', showText = true, className }: BeHalixLogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bh-top" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF4D6D" />
            <stop offset="100%" stopColor="#FF8C42" />
          </linearGradient>
          <linearGradient id="bh-bottom" x1="0" y1="24" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#00C9A7" />
          </linearGradient>
        </defs>
        <path
          d="M8 8 C8 8, 8 24, 24 24 C32 24, 36 20, 36 14 C36 10, 33 8, 30 8 C27 8, 25 10, 25 14"
          stroke="url(#bh-top)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M40 40 C40 40, 40 24, 24 24 C16 24, 12 28, 12 34 C12 38, 15 40, 18 40 C21 40, 23 38, 23 34"
          stroke="url(#bh-bottom)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className={cn('font-bold tracking-tight', text)}>
          <span className="text-brand-pink">Be</span>
          <span className="text-foreground">Halix</span>
        </span>
      )}
    </span>
  );
}
