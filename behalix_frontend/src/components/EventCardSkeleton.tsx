import { cn } from '@/lib/utils';

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col w-full rounded-2xl overflow-hidden bg-card border border-border/80 animate-pulse',
        className
      )}
    >
      {/* Image area */}
      <div className="relative w-full aspect-[2.4/1] bg-muted">
        <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-muted-foreground/10 w-10 h-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-2.5">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="space-y-1.5">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-5 w-5 rounded-full bg-muted" />
          </div>
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  );
}
