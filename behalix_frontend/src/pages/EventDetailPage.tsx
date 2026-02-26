import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trash2,
  Share2,
  Clock,
  ImageOff,
  ExternalLink,
  X,
  MoreHorizontal,
  PartyPopper,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useLoginModalStore } from "@/store/login-modal-store";
import type {
  EventDetail,
  EventListItem,
  EventAttendee,
  AttendeePreviewItem,
  EventReactionType,
  EventReactionCounts,
  EventsResponse,
} from "@/types/event";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Avatar } from "@/components/Avatar";
import { AttendeeProfileModal } from "@/components/AttendeeProfileModal";
import { EventComments } from "@/components/EventComments";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

/* ── Helpers ─────────────────────────────────────────── */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtAddr(a: EventDetail["address"]) {
  return [a.line1, a.line2, a.city, a.state, a.zipCode]
    .filter(Boolean)
    .join(", ");
}

function mapLink(a: EventDetail["address"]) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fmtAddr(a))}`;
}

function calLink(e: EventDetail) {
  const s = new Date(e.timestamp);
  const end = new Date(s.getTime() + 7200000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${f(s)}/${f(end)}&details=${encodeURIComponent(e.description || "")}&location=${encodeURIComponent(fmtAddr(e.address))}`;
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric" });
}
function fmtMonth(iso: string) {
  return new Date(iso)
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
}

const REACTION_CONFIG: {
  type: EventReactionType;
  emoji: string;
  label: string;
}[] = [
  { type: "excited", emoji: "\u{1F525}", label: "Excited" },
  { type: "interested", emoji: "\u{1F440}", label: "Interested" },
  { type: "skeptical", emoji: "\u{1F914}", label: "Skeptical" },
  { type: "not_for_me", emoji: "\u{1F44B}", label: "Not for me" },
];

/* ── Image Gallery (Bento Grid) ──────────────────────── */

function ImageGallery({
  images,
  onOpen,
}: {
  images: EventDetail["images"];
  onOpen: (i: number) => void;
}) {
  if (!images.length) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-brand-pink/5 via-brand-orange/5 to-brand-teal/5 aspect-[2.2/1] flex flex-col items-center justify-center gap-2">
        <ImageOff className="h-10 w-10 text-muted-foreground/20" />
        <span className="text-xs text-muted-foreground/40">No photos yet</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="block w-full rounded-2xl overflow-hidden group cursor-zoom-in"
      >
        <img
          src={images[0].url}
          alt=""
          className="w-full aspect-[2.2/1] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </button>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(i)}
            className="group overflow-hidden cursor-zoom-in"
          >
            <img
              src={img.url}
              alt=""
              className="w-full aspect-4/3 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden"
      style={{ height: "clamp(240px, 40vw, 420px)" }}
    >
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="col-span-2 group overflow-hidden cursor-zoom-in"
      >
        <img
          src={images[0].url}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </button>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onOpen(1)}
          className="flex-1 group overflow-hidden cursor-zoom-in"
        >
          <img
            src={images[1].url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        </button>
        {images.length === 3 ? (
          <button
            type="button"
            onClick={() => onOpen(2)}
            className="flex-1 group overflow-hidden cursor-zoom-in"
          >
            <img
              src={images[2].url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpen(2)}
            className="relative flex-1 group overflow-hidden cursor-zoom-in"
          >
            <img
              src={images[2].url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/40">
              <span className="text-white font-semibold text-lg">
                +{images.length - 2}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Image Lightbox ──────────────────────────────────── */

function Lightbox({
  images,
  index,
  onClose,
}: {
  images: EventDetail["images"];
  index: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(index);
  const img = images[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums font-medium">
          {idx + 1} / {images.length}
        </p>
      )}

      <img
        src={img?.url}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-200 ${i === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Attendees
  const [attendees, setAttendees] = useState<EventAttendee[] | null>(null);
  const [attendeesPreview, setAttendeesPreview] = useState<{
    count: number;
    attendees: AttendeePreviewItem[];
  } | null>(null);
  const [showAllAttendees, setShowAllAttendees] = useState(false);
  const [selectedAttendee, setSelectedAttendee] =
    useState<EventAttendee | null>(null);

  // Reactions
  const [reactionCounts, setReactionCounts] = useState<EventReactionCounts>({
    excited: 0,
    interested: 0,
    skeptical: 0,
    not_for_me: 0,
  });
  const [userReaction, setUserReaction] = useState<EventReactionType | null>(
    null,
  );

  // Similar events
  const [similarEvents, setSimilarEvents] = useState<EventListItem[]>([]);

  // Sticky bar visibility
  const rsvpSectionRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Admin menu
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCreator = !!(
    event?.createdBy &&
    currentUserId &&
    String(event.createdBy) === currentUserId
  );

  /* ── Data ────────────────────────────────────────── */

  const fetchEvent = () => {
    if (!id) return;
    return api
      .get<EventDetail>(`/events/${id}`)
      .then(({ data }) => setEvent(data));
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<EventDetail>(`/events/${id}`)
      .then(({ data }) => {
        if (!cancelled) setEvent(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error ?? "Failed to load event");
          setEvent(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ count: number; attendees: AttendeePreviewItem[] }>(
        `/events/${id}/attendees-preview`,
      )
      .then(({ data }) =>
        setAttendeesPreview({
          count: data.count,
          attendees: data.attendees ?? [],
        }),
      )
      .catch(() => setAttendeesPreview(null));
  }, [id]);

  useEffect(() => {
    if (!id || !isCreator) return;
    api
      .get<{ rsvps: EventAttendee[] }>(`/events/${id}/rsvps`)
      .then(({ data }) => setAttendees(data.rsvps ?? []))
      .catch(() => setAttendees([]));
  }, [id, isCreator]);

  useEffect(() => {
    if (!id) return;
    api
      .get<{
        counts: EventReactionCounts;
        userReaction: EventReactionType | null;
      }>(`/events/${id}/reactions`)
      .then(({ data }) => {
        setReactionCounts(
          data.counts ?? {
            excited: 0,
            interested: 0,
            skeptical: 0,
            not_for_me: 0,
          },
        );
        setUserReaction(data.userReaction ?? null);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<EventsResponse>("/events", { params: { limit: 6 } })
      .then(({ data }) => {
        const filtered = (data.events ?? []).filter(
          (e) => (e.id || e._id) !== id,
        );
        setSimilarEvents(filtered.slice(0, 4));
      })
      .catch(() => setSimilarEvents([]));
  }, [id]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      setShowStickyBar(!entry.isIntersecting);
    },
    [],
  );

  useEffect(() => {
    const node = rsvpSectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersection, event]);

  useEffect(() => {
    if (!showAdminMenu) return;
    const handler = () => setShowAdminMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showAdminMenu]);

  /* ── Actions ─────────────────────────────────────── */

  const handleRsvp = async () => {
    if (!id || rsvpLoading) return;
    if (!isAuthenticated()) {
      openLoginModal(`/events/${id}`);
      return;
    }
    setRsvpLoading(true);
    try {
      await api.post(`/events/${id}/rsvp`);
      toast.success("RSVP confirmed! You're going.");
      await fetchEvent();
      api
        .get<{ count: number; attendees: AttendeePreviewItem[] }>(
          `/events/${id}/attendees-preview`,
        )
        .then(({ data }) =>
          setAttendeesPreview({
            count: data.count,
            attendees: data.attendees ?? [],
          }),
        )
        .catch(() => {});
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Could not RSVP to event",
      );
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!id || rsvpLoading) return;
    if (!isAuthenticated()) {
      openLoginModal(`/events/${id}`);
      return;
    }
    setRsvpLoading(true);
    try {
      await api.delete(`/events/${id}/rsvp`);
      toast.success("RSVP cancelled successfully");
      await fetchEvent();
      api
        .get<{ count: number; attendees: AttendeePreviewItem[] }>(
          `/events/${id}/attendees-preview`,
        )
        .then(({ data }) =>
          setAttendeesPreview({
            count: data.count,
            attendees: data.attendees ?? [],
          }),
        )
        .catch(() => {});
      if (isCreator) {
        const r = await api.get<{ rsvps: EventAttendee[] }>(
          `/events/${id}/rsvps`,
        );
        setAttendees(r.data.rsvps ?? []);
      }
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Could not cancel RSVP",
      );
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || deleteLoading) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Could not delete event",
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share)
      navigator.share({ title: event?.title ?? "Event", url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      });
    else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleReaction = async (type: EventReactionType) => {
    if (!id || !currentUserId) return;
    try {
      await api.post(`/events/${id}/reactions`, { type });
      const { data } = await api.get<{
        counts: EventReactionCounts;
        userReaction: EventReactionType | null;
      }>(`/events/${id}/reactions`);
      setReactionCounts(
        data.counts ?? {
          excited: 0,
          interested: 0,
          skeptical: 0,
          not_for_me: 0,
        },
      );
      setUserReaction(data.userReaction ?? null);
    } catch {
      toast.error("Failed to react");
    }
  };

  /* ── Loading skeleton ────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 container max-w-7xl py-8">
          <div className="h-4 w-16 bg-muted rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl bg-muted aspect-[2.2/1] animate-pulse" />
              <div className="space-y-4 animate-pulse">
                <div className="h-8 w-3/4 bg-muted rounded-lg" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-5/6 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-5">
              <div className="rounded-2xl border bg-card p-6 h-72 animate-pulse" />
              <div className="rounded-2xl border bg-card p-6 h-48 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────── */

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 animate-in fade-in duration-300 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-semibold">Event not found</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {error ??
                "This event may have been removed or the link is incorrect."}
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to events
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  /* ── Derived ─────────────────────────────────────── */

  const images = event.images ?? [];
  const goingCount = event.rsvpCount ?? 0;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? `Join ${event.title} on BeHalix!`,
    startDate: event.timestamp,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.address?.line1 ?? "TBD",
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address?.line1 ?? "",
        addressLocality: event.address?.city ?? "",
        addressRegion: event.address?.state ?? "",
        postalCode: event.address?.zipCode ?? "",
      },
    },
    image: images.map((i) => i.url),
    organizer: event.creator
      ? {
          "@type": "Person",
          name: event.creator.displayName,
        }
      : undefined,
  };

  /* ── Render ──────────────────────────────────────── */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${event.title} - BeHalix`}
        description={
          event.description
            ? event.description.slice(0, 160)
            : `Join ${event.title} on BeHalix!`
        }
        image={images.length > 0 ? images[0].url : undefined}
        type="article"
        canonicalUrl={currentUrl}
        jsonLd={JSON.stringify(eventJsonLd)}
      />
      <AppHeader />

      <main className="flex-1">
        <div className="container max-w-7xl py-6 sm:py-8 animate-in fade-in duration-300">
          {/* Breadcrumb */}
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT COLUMN ──────────────────────── */}
            <div className="lg:col-span-8 space-y-8">
              {/* Image Gallery */}
              <div className="rounded-2xl overflow-hidden shadow-sm">
                <ImageGallery
                  images={images}
                  onOpen={(i) => setLightboxIdx(i)}
                />
              </div>

              {/* Mobile Header */}
              <div className="lg:hidden space-y-4">
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {event.isWomenOnly && (
                      <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                        Women only
                      </span>
                    )}
                    {event.userHasRsvped && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-3 py-1 flex items-center gap-1">
                        <PartyPopper className="h-3 w-3" />
                        You&apos;re going!
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {event.title}
                  </h1>

                  {event.creator && (
                    <div className="flex items-center gap-2">
                      <Avatar
                        avatarId={event.creator.avatarId}
                        displayName={event.creator.displayName}
                        size="xs"
                      />
                      <span className="text-sm text-muted-foreground">
                        by{" "}
                        <span className="font-medium text-foreground">
                          {event.creator.displayName}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Quick info pills */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      {fmtDate(event.timestamp)} &middot;{" "}
                      {fmtTime(event.timestamp)}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {[event.address.city, event.address.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section */}
              {event.description && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold tracking-tight">
                    About this event
                  </h2>
                  <div className="text-muted-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </div>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {event.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-medium border border-border/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reactions (inline — feels more natural here) */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <span className="text-sm font-medium text-muted-foreground mr-1">
                  React:
                </span>
                {REACTION_CONFIG.map(({ type, emoji, label }) => {
                  const active = userReaction === type;
                  const count = reactionCounts[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      disabled={!currentUserId}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-secondary text-secondary-foreground hover:bg-muted hover:scale-105"
                      }`}
                    >
                      <span className="text-sm leading-none">{emoji}</span>
                      <span>{label}</span>
                      {count > 0 && (
                        <span className="tabular-nums opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Discussion Section */}
              <div className="pt-6 border-t">
                <h2 className="text-xl font-bold tracking-tight mb-5">
                  Discussion
                </h2>
                <EventComments eventId={id!} currentUserId={currentUserId} />
              </div>
            </div>

            {/* ── RIGHT COLUMN (Sticky Sidebar) ──────── */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
              {/* Event Info Card (Desktop) */}
              <div className="hidden lg:block rounded-2xl border bg-card shadow-sm overflow-hidden">
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-brand-pink via-brand-orange to-brand-teal" />

                <div className="p-6 space-y-5">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight leading-snug">
                      {event.title}
                    </h1>
                    {event.creator && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar
                          avatarId={event.creator.avatarId}
                          displayName={event.creator.displayName}
                          size="xs"
                        />
                        <span className="text-sm text-muted-foreground">
                          by{" "}
                          <span className="font-medium text-foreground">
                            {event.creator.displayName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  {(event.isWomenOnly || event.userHasRsvped) && (
                    <div className="flex flex-wrap gap-2">
                      {event.isWomenOnly && (
                        <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                          Women only
                        </span>
                      )}
                      {event.userHasRsvped && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-3 py-1 flex items-center gap-1">
                          <PartyPopper className="h-3 w-3" />
                          You&apos;re going!
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {fmtDate(event.timestamp)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {fmtTime(event.timestamp)}
                        </p>
                        {event.assemblyTime && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Assembly at{" "}
                            {event.assemblyTime}
                          </p>
                        )}
                        <a
                          href={calLink(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5 font-medium"
                        >
                          Add to calendar <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-teal/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-brand-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {event.address.line1}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[event.address.city, event.address.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <a
                          href={mapLink(event.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mt-1.5 font-medium"
                        >
                          View on map <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP Card */}
              <div
                ref={rsvpSectionRef}
                className="rounded-2xl border bg-card p-6 shadow-sm space-y-4"
              >
                {/* Attendee count + preview */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{goingCount}</span>
                  <span className="text-muted-foreground">going</span>
                </div>

                {attendeesPreview && attendeesPreview.attendees.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {attendeesPreview.attendees.slice(0, 6).map((a) => (
                        <div
                          key={a.userId}
                          className="rounded-full ring-2 ring-card"
                        >
                          <Avatar
                            avatarId={a.avatarId}
                            displayName={a.displayName}
                            size="sm"
                          />
                        </div>
                      ))}
                      {attendeesPreview.count > 6 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] ring-2 ring-card font-bold text-muted-foreground">
                          +{attendeesPreview.count - 6}
                        </div>
                      )}
                    </div>
                    {isCreator && (
                      <button
                        onClick={() => setShowAllAttendees(true)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>
                )}

                {/* RSVP Button */}
                {event.userHasRsvped ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelRsvp}
                    disabled={rsvpLoading}
                  >
                    {rsvpLoading ? "Cancelling..." : "Cancel RSVP"}
                  </Button>
                ) : (
                  <Button
                    className="w-full animate-pulse-glow"
                    size="lg"
                    onClick={handleRsvp}
                    disabled={rsvpLoading}
                  >
                    {rsvpLoading ? "Joining..." : "Count me in!"}
                  </Button>
                )}

                {/* Actions row */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex-1 text-muted-foreground"
                  >
                    <Share2 className="h-4 w-4 mr-1.5" /> Share
                  </Button>
                  {isCreator && (
                    <div className="relative flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAdminMenu((prev) => !prev);
                        }}
                        className="w-full text-muted-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4 mr-1.5" /> Manage
                      </Button>
                      {showAdminMenu && (
                        <div className="absolute bottom-full right-0 mb-2 min-w-[180px] p-1.5 rounded-xl border bg-card shadow-lg z-20 animate-in fade-in zoom-in-95 space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm"
                            asChild
                          >
                            <Link to={`/events/${id}/edit`}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit event
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                              setShowAdminMenu(false);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete event
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Similar Events ──────────────────────── */}
          {similarEvents.length > 0 && (
            <section className="mt-16 sm:mt-20 pt-10 border-t">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    You might also like
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    More events happening soon
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                >
                  <Link to="/events" className="gap-1">
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {similarEvents.map((evt) => (
                  <EventCard key={evt.id || evt._id} event={evt} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Sticky Bottom RSVP Bar (mobile) ──── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t bg-background/90 backdrop-blur-xl transition-all duration-300 ${
          showStickyBar
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="container px-4 flex items-center gap-3 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fmtMonth(event.timestamp)} {fmtDay(event.timestamp)} &middot;{" "}
              {fmtTime(event.timestamp)}
            </p>
          </div>
          {event.userHasRsvped ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelRsvp}
              disabled={rsvpLoading}
              className="shrink-0 rounded-full px-4"
            >
              {rsvpLoading ? "..." : "Cancel"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleRsvp}
              disabled={rsvpLoading}
              className="shrink-0 rounded-full px-5"
            >
              {rsvpLoading ? "..." : "Join"}
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0 -z-10"
            onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
          />
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold">Delete this event?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. The event and its RSVPs will be
              removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete event"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee modal */}
      {selectedAttendee && (
        <AttendeeProfileModal
          attendee={selectedAttendee}
          onClose={() => setSelectedAttendee(null)}
          showContactDetails={isCreator}
        />
      )}

      {/* Full Attendee List Modal */}
      {showAllAttendees && attendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowAllAttendees(false)}
          />
          <div className="relative w-full max-w-md bg-card border rounded-2xl shadow-xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <h2 className="text-base font-bold">
                Who&apos;s going ({attendees.length})
              </h2>
              <button
                onClick={() => setShowAllAttendees(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              {attendees.map((a) => (
                <button
                  key={a.userId}
                  onClick={() => {
                    setSelectedAttendee(a);
                    setShowAllAttendees(false);
                  }}
                  className="flex items-center gap-3 w-full px-5 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 text-left group"
                >
                  <Avatar
                    avatarId={a.avatarId}
                    displayName={a.displayName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {a.displayName || "Unknown User"}
                      </span>
                      {a.isHost && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          Host
                        </span>
                      )}
                    </div>
                    {a.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
