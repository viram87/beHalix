import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  MapPin,
  Sparkles,
  PlusCircle,
  Share2,
  Coffee,
  Code2,
  Palette,
  Heart,
  BookOpen,
  ArrowRight,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLoginModalStore } from '@/store/login-modal-store';
import type { EventListItem, EventsResponse } from '@/types/event';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { SocialProofMarquee } from '@/components/SocialProofMarquee';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

function EventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<EventsResponse>('/events', { params: { page, limit } })
      .then(({ data }) => {
        if (!cancelled) {
          setEvents(data.events);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        }
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Events - BeHalix" description="Discover and join events near you. Whatever you're into — find your people on BeHalix." />
      <AppHeader />

      {/* ═══════════════════════════════════════════════════════
          HERO — Emotional, social-proof-driven, clear value prop
          Psychology: Anchoring (stats), Belonging (people language),
          Fitts's Law (large CTA), Von Restorff (gradient accent)
         ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-pink via-brand-orange to-brand-teal">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full bg-white/8 blur-3xl -translate-y-1/3 translate-x-1/3" aria-hidden />
        <div className="absolute bottom-0 left-0 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] rounded-full bg-white/6 blur-3xl translate-y-1/3 -translate-x-1/3" aria-hidden />

        <div className="container relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Headline + CTA */}
            <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium mb-6 border border-white/20">
                <Zap className="h-3.5 w-3.5" />
                Your next experience starts here
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                Find your people.
                <br />
                <span className="opacity-90">Show up together.</span>
              </h1>

              <p className="mt-5 text-white/80 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                Whatever you&apos;re into — coding, hiking, art, or just vibing — there&apos;s a meetup for you. Create or join events and build real connections.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-7 font-semibold shadow-xl bg-white text-foreground hover:bg-white/90 animate-pulse-glow"
                >
                  <a href="#upcoming-events">
                    Explore events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild={isAuthenticated()}
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 font-semibold border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={!isAuthenticated() ? () => openLoginModal('/create-event') : undefined}
                >
                  {isAuthenticated() ? <Link to="/create-event">Host an event</Link> : <span>Host an event</span>}
                </Button>
              </div>

              {/* Social proof stats — anchoring + trust */}
              <div className="mt-10 flex items-center gap-6 sm:gap-8 justify-center lg:justify-start">
                {[
                  { value: `${total || '50'}+`, label: 'Events' },
                  { value: '500+', label: 'People' },
                  { value: 'Free', label: 'Always' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[11px] uppercase tracking-wider text-white/60 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating cards (desktop) */}
            <div className="relative hidden lg:flex items-center justify-center min-h-[340px]">
              <div className="absolute top-2 right-4 animate-float" style={{ '--float-rotate': '-2deg' } as React.CSSProperties}>
                <div className="w-[150px] rounded-2xl bg-white/15 backdrop-blur-md px-5 py-4 shadow-2xl border border-white/20">
                  <MapPin className="h-7 w-7 text-white/90 mb-2" />
                  <span className="text-sm font-bold text-white">Near you</span>
                  <p className="text-[10px] text-white/60 mt-0.5">Local events first</p>
                </div>
              </div>
              <div className="absolute top-24 left-2 animate-float-delayed" style={{ '--float-rotate': '3deg' } as React.CSSProperties}>
                <div className="w-[150px] rounded-2xl bg-white/15 backdrop-blur-md px-5 py-4 shadow-2xl border border-white/20">
                  <Calendar className="h-7 w-7 text-white/90 mb-2" />
                  <span className="text-sm font-bold text-white">This week</span>
                  <p className="text-[10px] text-white/60 mt-0.5">Don&apos;t miss out</p>
                </div>
              </div>
              <div className="absolute bottom-14 right-6 animate-float-slow" style={{ '--float-rotate': '-1deg' } as React.CSSProperties}>
                <div className="w-[150px] rounded-2xl bg-white/15 backdrop-blur-md px-5 py-4 shadow-2xl border border-white/20">
                  <Users className="h-7 w-7 text-white/90 mb-2" />
                  <span className="text-sm font-bold text-white">Your tribe</span>
                  <p className="text-[10px] text-white/60 mt-0.5">People like you</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-8 animate-float" style={{ '--float-rotate': '2deg' } as React.CSSProperties}>
                <div className="w-[150px] rounded-2xl bg-white/15 backdrop-blur-md px-5 py-4 shadow-2xl border border-white/20">
                  <Sparkles className="h-7 w-7 text-white/90 mb-2" />
                  <span className="text-sm font-bold text-white">Curated</span>
                  <p className="text-[10px] text-white/60 mt-0.5">For your interests</p>
                </div>
              </div>
            </div>

            {/* Mobile: Compact tag row */}
            <div className="flex flex-wrap justify-center gap-2 lg:hidden">
              {[
                { icon: MapPin, label: 'Near you' },
                { icon: Calendar, label: 'This week' },
                { icon: Users, label: 'Your tribe' },
                { icon: Sparkles, label: 'Curated' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5 border border-white/20 text-white">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 bg-background">

        {/* ── Upcoming Events ──────────────────────────────── */}
        <section id="upcoming-events" className="container max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Upcoming events
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Discover what&apos;s happening around you
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-primary">
              <Link to="/events" className="gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No events yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Be the first to create an event and bring people together.
              </p>
              <Button
                asChild={isAuthenticated()}
                className="mt-2"
                onClick={!isAuthenticated() ? () => openLoginModal('/create-event') : undefined}
              >
                {isAuthenticated() ? (
                  <Link to="/create-event">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create event
                  </Link>
                ) : (
                  <span className="inline-flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create event
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {events.map((event) => (
                  <EventCard
                    key={event.id ?? (event as { _id?: string })._id ?? ''}
                    event={event}
                    onSaveToggle={(eventId, saved) => {
                      setEvents((prev) =>
                        prev.map((e) =>
                          (e.id ?? e._id) === eventId ? { ...e, userHasSaved: saved } : e
                        )
                      );
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 w-9 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums px-3">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-9 w-9 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── How It Works ─────────────────────────────────
            Psychology: Zeigarnik effect (numbered steps imply progress),
            Progressive disclosure (simple 3-step mental model),
            Cognitive fluency (easy to parse = more trustworthy)
           ──────────────────────────────────────────────── */}
        <section className="bg-muted/40">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
                Three steps to your next great experience
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-10">
              {[
                {
                  step: '01',
                  icon: PlusCircle,
                  title: 'Create or find',
                  desc: 'Host your own event or browse what\'s on. Free, simple, no strings attached.',
                  color: 'text-brand-pink bg-brand-pink/10',
                },
                {
                  step: '02',
                  icon: Share2,
                  title: 'Share & RSVP',
                  desc: 'Invite your community or join others. See who\'s going before you commit.',
                  color: 'text-brand-orange bg-brand-orange/10',
                },
                {
                  step: '03',
                  icon: Coffee,
                  title: 'Show up',
                  desc: 'Meet in person or online. No pressure, just real conversations and connections.',
                  color: 'text-brand-teal bg-brand-teal/10',
                },
              ].map(({ step, icon: Icon, title, desc, color }) => (
                <div key={step} className="relative text-center sm:text-left group">
                  <div className="flex flex-col items-center sm:items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{step}</span>
                      <h3 className="font-bold text-lg mt-1">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof Marquee ─────────────────────────
            Psychology: Social proof (Cialdini), Bandwagon effect,
            Narrative transportation (real stories pull you in)
           ──────────────────────────────────────────────── */}
        <SocialProofMarquee />

        {/* ── Browse by Interest ───────────────────────────
            Psychology: Recognition over recall (icons + labels),
            Paradox of choice (limited set, not overwhelming)
           ──────────────────────────────────────────────── */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Browse by interest
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Find events that match what you care about
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Tech & Code', icon: Code2, accent: 'hover:border-brand-teal/40 hover:bg-brand-teal/5' },
              { label: 'Social', icon: Users, accent: 'hover:border-brand-pink/40 hover:bg-brand-pink/5' },
              { label: 'Women only', icon: Heart, accent: 'hover:border-brand-pink/40 hover:bg-brand-pink/5' },
              { label: 'Workshops', icon: Palette, accent: 'hover:border-brand-orange/40 hover:bg-brand-orange/5' },
              { label: 'Books & reading', icon: BookOpen, accent: 'hover:border-brand-teal/40 hover:bg-brand-teal/5' },
            ].map(({ label, icon: Icon, accent }) => (
              <Link
                key={label}
                to="/events"
                className={`inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all duration-200 ${accent} hover:shadow-sm`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Community CTA ────────────────────────────────
            Psychology: Belonging need (Maslow), FOMO trigger
           ──────────────────────────────────────────────── */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="card-gradient-border p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Join a community
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                    Events are even better with a crew. Find your community or start one — it&apos;s where repeat meetups and real friendships happen.
                  </p>
                </div>
              </div>
              <Button
                asChild={isAuthenticated()}
                size="lg"
                variant="outline"
                className="shrink-0 rounded-full px-6"
                onClick={!isAuthenticated() ? () => openLoginModal('/communities/discover') : undefined}
              >
                {isAuthenticated() ? (
                  <Link to="/communities/discover">
                    Explore communities
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center">
                    Explore communities
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────
            Psychology: Endowment framing ("your event"),
            Action-oriented language
           ──────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-brand-pink via-brand-orange to-brand-teal">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to bring people together?
            </h2>
            <p className="text-white/80 text-sm sm:text-base mt-3 max-w-lg mx-auto leading-relaxed">
              Create your first event in minutes. No cost, no commitment — just pick a time, invite people, and show up.
            </p>
            <Button
              asChild={isAuthenticated()}
              size="lg"
              className="mt-8 rounded-full px-8 font-semibold shadow-xl bg-white text-foreground hover:bg-white/90"
              onClick={!isAuthenticated() ? () => openLoginModal('/create-event') : undefined}
            >
              {isAuthenticated() ? (
                <Link to="/create-event">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create your event
                </Link>
              ) : (
                <span className="inline-flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create your event
                </span>
              )}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default EventsPage;
