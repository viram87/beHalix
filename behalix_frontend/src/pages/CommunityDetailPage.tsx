import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, PlusCircle, Pencil, Trash2, Share2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { CommunityDetail } from '@/types/community';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const fetchCommunity = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<CommunityDetail>(`/communities/${id}`)
      .then(({ data }) => setCommunity(data))
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  // Sticky bar visibility
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    return () => observer.disconnect();
  }, [community]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: community?.name ?? 'Community', url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleJoin = async () => {
    if (!id || joinLeaveLoading) return;
    setJoinLeaveLoading(true);
    try {
      await api.post(`/communities/${id}/join`);
      toast.success('Joined community successfully');
      fetchCommunity();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Could not join community');
    } finally {
      setJoinLeaveLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!id || joinLeaveLoading) return;
    setJoinLeaveLoading(true);
    try {
      await api.delete(`/communities/${id}/leave`);
      toast.success('Left community successfully');
      fetchCommunity();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Could not leave community');
    } finally {
      setJoinLeaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || deleteLoading || !confirm('Delete this community? Events will be unlinked. This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/communities/${id}`);
      toast.success('Community deleted successfully');
      navigate('/communities');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Could not delete community');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6">
          <p className="text-destructive">Community not found.</p>
          <Button variant="ghost" asChild>
            <Link to="/communities">Back to communities</Link>
          </Button>
        </main>
      </div>
    );
  }

  const isCreator = currentUserId && String(community.createdBy) === currentUserId;
  const canLeave = community.isMember && !isCreator;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const communityJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": community.name,
    "description": community.description ?? `Join the ${community.name} community on BeHalix!`,
    "url": currentUrl,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/FollowAction",
      "userInteractionCount": community.memberCount
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title={`${community.name} - BeHalix`} 
        description={community.description ? community.description.slice(0, 160) : `Join the ${community.name} community on BeHalix!`}
        type="article"
        canonicalUrl={currentUrl}
        jsonLd={JSON.stringify(communityJsonLd)}
      />
      <AppHeader />
      <main className="container flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <Link
          to="/communities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Communities
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{community.name}</h1>
              
              {/* Mobile Actions removed in favor of Sticky Bottom Bar */}

              {community.description && (
                <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                  {community.description}
                </div>
              )}
            </div>

            {community.isMember && (
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </h2>
                {!community.events?.length ? (
                  <div className="rounded-xl border border-dashed p-8 text-center bg-muted/30">
                     <p className="text-muted-foreground">No upcoming events scheduled.</p>
                     {isCreator && <p className="text-xs text-muted-foreground mt-1">Create one to get started.</p>}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {community.events.map((ev) => (
                      <Link
                        key={ev._id}
                        to={`/events/${ev._id}`}
                        className="group block rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                      >
                         <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">{ev.title}</h3>
                         <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(ev.timestamp)}
                            </span>
                             {ev.rsvpCount != null && (
                                <span className="flex items-center gap-1.5">
                                   <Users className="h-3.5 w-3.5" />
                                   {ev.rsvpCount} going
                                </span>
                             )}
                         </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (Sticky Sidebar) */}
              <div ref={sidebarRef} className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle>Community Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <span className="font-medium text-foreground">{community.memberCount ?? community.memberIds?.length ?? 0}</span> members
                    </div>

                    <div className="space-y-2 pt-2">
                        {!community.isMember ? (
                            <Button className="w-full" size="lg" onClick={handleJoin} disabled={joinLeaveLoading}>
                                {joinLeaveLoading ? 'Joining...' : 'Join Community'}
                            </Button>
                        ) : (
                            isCreator && (
                                <Button className="w-full" asChild>
                                    <Link to={`/create-event?communityId=${community._id}`}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Link>
                                </Button>
                            )
                        )}

                        {canLeave && (
                            <Button variant="outline" className="w-full" onClick={handleLeave} disabled={joinLeaveLoading}>
                                {joinLeaveLoading ? 'Leaving...' : 'Leave Community'}
                            </Button>
                        )}
                    </div>

                     {isCreator && (
                        <div className="pt-4 border-t space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin Controls</p>
                             <Button asChild variant="secondary" className="w-full justify-start" size="sm">
                                <Link to={`/communities/${id}/edit`}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Details
                                </Link>
                            </Button>
                             <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" size="sm" onClick={handleDelete} disabled={deleteLoading}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleteLoading ? 'Deleting...' : 'Delete Community'}
                            </Button>
                        </div>
                    )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={handleShare} className="w-full">
                           <Share2 className="h-4 w-4 mr-2" /> Share
                        </Button>
                        {isCreator && (
                           <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                               <Link to={`/communities/${id}/edit`}>
                                   <MoreHorizontal className="h-4 w-4 mr-2" /> Manage
                               </Link>
                           </Button>
                        )}
                     </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (mobile) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t bg-background/80 backdrop-blur-lg transition-all duration-300 ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="container px-4 flex items-center gap-3 py-3">
          <p className="flex-1 text-sm font-medium truncate">{community.name}</p>
          {!community.isMember ? (
             <Button size="sm" onClick={handleJoin} disabled={joinLeaveLoading} className="shrink-0">
               {joinLeaveLoading ? '...' : 'Join'}
             </Button>
          ) : (
              // If member, show 'Create Event' as primary action if creator, else maybe just 'Leave' (hidden in menu) or nothing?
              // Let's show Create Event for creator, and maybe nothing for regular member (or Share)
              isCreator && (
                  <Button size="sm" asChild className="shrink-0">
                      <Link to={`/create-event?communityId=${community._id}`}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Event
                      </Link>
                  </Button>
              )
          )}
        </div>
      </div>
    </div>
  );
}
