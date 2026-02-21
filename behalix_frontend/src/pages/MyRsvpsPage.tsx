import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Ticket } from 'lucide-react';
import { api } from '@/lib/api';
import type { UserRsvpItem } from '@/types/event';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyRsvpsPage() {
  const [rsvps, setRsvps] = useState<UserRsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ rsvps: UserRsvpItem[]; pagination: { page: number; totalPages: number; total: number } }>(
        '/users/me/rsvps',
        { params: { page, limit } }
      )
      .then(({ data }) => {
        if (!cancelled) {
          setRsvps(data.rsvps ?? []);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setTotal(data.pagination?.total ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) setRsvps([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My RSVPs</h1>
          <p className="text-muted-foreground text-sm mt-1">Events you&apos;ve signed up for.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden animate-pulse">
                <div className="h-32 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rsvps.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Ticket className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium text-lg">No events yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                You haven&apos;t RSVPed to any events. Discover and join one!
              </p>
            </div>
            <Button asChild>
              <Link to="/events">Browse events</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rsvps.map((item) => (
                <Link
                  key={item.rsvpId}
                  to={`/events/${item.event.id}`}
                  className="group block rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20"
                >
                  <div className="p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {formatShortDate(item.event.timestamp)}
                    </p>
                    <h3 className="mt-1 font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {item.event.title}
                    </h3>
                    {(item.event.address?.city || item.event.address?.state) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {[item.event.address.city, item.event.address.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      RSVPed {formatDate(item.rsvpedAt)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      View event
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
