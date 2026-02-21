import { Mail, Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { EventAttendee } from '@/types/event';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';

type AttendeeProfileModalProps = {
  attendee: EventAttendee | null;
  onClose: () => void;
  /** When true, show email/phone so host can contact. Only event creator gets this. */
  showContactDetails?: boolean;
};

export function AttendeeProfileModal({ attendee, onClose, showContactDetails }: AttendeeProfileModalProps) {
  if (!attendee) return null;

  const name = attendee.displayName?.trim() || attendee.email || 'Attendee';
  const hasContact = showContactDetails && (attendee.email || attendee.phone);

  const copyToClipboard = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-background border rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <Avatar avatarId={attendee.avatarId} displayName={name} size="lg" />
          <h3 className="font-semibold text-lg">{name}</h3>
          {attendee.isHost && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">Host</span>
          )}
        </div>

        {hasContact && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Contact (only you as host can see this)</p>
            {attendee.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${attendee.email}`} className="text-sm truncate flex-1 hover:underline">
                  {attendee.email}
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard('Email', attendee.email!)}
                  className="p-1.5 rounded-md hover:bg-muted"
                  aria-label="Copy email"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
            {attendee.phone && attendee.phone.trim() && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${attendee.phone.trim()}`} className="text-sm truncate flex-1 hover:underline">
                  {attendee.phone.trim()}
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard('Phone', attendee.phone!.trim())}
                  className="p-1.5 rounded-md hover:bg-muted"
                  aria-label="Copy phone"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {attendee.interests?.length ? (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {attendee.interests.map((i, idx) => (
                <span key={idx} className="rounded-full bg-muted px-2 py-0.5 text-sm">
                  {i}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
