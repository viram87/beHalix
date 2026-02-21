import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLoginModalStore } from '@/store/login-modal-store';
import type { EventListItem } from '@/types/event';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/Avatar';

type EventCardProps = {
  event: EventListItem;
  className?: string;
  onSaveToggle?: (eventId: string, saved: boolean) => void;
};

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric' });
}
function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function formatWeekday(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

/** Check if event is happening within 48h */
function isSoon(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < 48 * 60 * 60 * 1000;
}

export function EventCard({ event, className, onSaveToggle }: EventCardProps) {
  const imageUrl = event.images?.[0]?.url;
  const city = event.address?.city ?? '';
  const venue = event.address?.line1
    ? `${event.address.line1.slice(0, 30)}${event.address.line1.length > 30 ? '...' : ''}`
    : city;

  const [saved, setSaved] = useState(event.userHasSaved ?? false);
  const [saveLoading, setSaveLoading] = useState(false);
  const eventId = event.id || event._id;

  useEffect(() => {
    setSaved(event.userHasSaved ?? false);
  }, [event.userHasSaved]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!eventId || saveLoading) return;
    if (!isAuthenticated()) {
      openLoginModal(window.location.pathname);
      return;
    }
    setSaveLoading(true);
    try {
      if (saved) {
        await api.delete(`/events/${eventId}/save`);
        setSaved(false);
        onSaveToggle?.(eventId, false);
        toast.success('Event removed from saved list');
      } else {
        await api.post(`/events/${eventId}/save`);
        setSaved(true);
        onSaveToggle?.(eventId, true);
        toast.success('Event saved to your list');
      }
    } catch {
      toast.error('Could not update saved status');
    } finally {
      setSaveLoading(false);
    }
  };

  const count = event.rsvpCount ?? 0;
  const preview = event.attendeePreview ?? [];
  const hasAttendees = count > 0 || preview.length > 0;
  const soon = isSoon(event.timestamp);

  return (
    <Link
      to={`/events/${eventId}`}
      className={cn(
        'group relative flex flex-col w-full rounded-2xl overflow-hidden bg-card',
        'border border-border/80 hover:border-primary/30',
        'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
        'transition-all duration-300 ease-out',
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-[2.4/1] bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-pink/10 via-brand-orange/5 to-brand-teal/10 flex items-center justify-center">
            <span className="text-muted-foreground/30 text-sm">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {event.isNewlyAdded && (
            <span className="inline-flex items-center rounded-full bg-brand-teal text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-md">
              New
            </span>
          )}
          {event.userHasRsvped && (
            <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-md">
              You&apos;re going
            </span>
          )}
          {!event.userHasRsvped && event.isWomenOnly && (
            <span className="inline-flex items-center rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5 shadow-md">
              Women only
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={saveLoading}
          className={cn(
            'absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all duration-200',
            saved
              ? 'bg-primary text-white scale-110'
              : 'bg-white/90 backdrop-blur-sm text-foreground/70 hover:bg-white hover:scale-110'
          )}
          aria-label={saved ? 'Unsave event' : 'Save event'}
        >
          <Star className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>

        {/* Date pill floating on bottom-left of image */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-sm px-2 py-1 shadow-md">
          <div className="text-center leading-none">
            <span className="block text-[10px] font-bold uppercase text-brand-pink tracking-wide">
              {formatMonth(event.timestamp)}
            </span>
            <span className="block text-lg font-bold leading-none text-foreground">
              {formatDay(event.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* Time row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{formatWeekday(event.timestamp)} &middot; {formatTime(event.timestamp)}</span>
          {soon && (
            <span className="ml-auto text-[10px] font-semibold text-brand-orange bg-brand-orange/10 rounded-full px-2 py-0.5">
              Soon
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="text-xs truncate">{venue || city || 'Venue TBA'}</span>
        </div>

        {/* Social proof — attendees (pushed to bottom) */}
        <div className="mt-auto pt-3 border-t border-border/50">
          {hasAttendees ? (
            <div className="flex items-center gap-2">
              {preview.length > 0 && (
                <div className="flex -space-x-1.5">
                  {preview.slice(0, 4).map((a, i) => (
                    <div
                      key={i}
                      className="rounded-full ring-2 ring-card shrink-0"
                      title={a.displayName}
                    >
                      <Avatar size="xs" avatarId={a.avatarId} displayName={a.displayName} className="h-5 w-5" />
                    </div>
                  ))}
                </div>
              )}
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {count > 0 ? `${count} going` : 'Going'}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">Be the first to join</p>
          )}
        </div>
      </div>
    </Link>
  );
}
