import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Compass, Users, CalendarDays, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { CommunityListItem } from '@/types/community';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ communities: CommunityListItem[] }>('/communities')
      .then(({ data }) => setCommunities(data.communities ?? []))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My communities</h1>
            <p className="text-muted-foreground text-sm mt-1">Communities you belong to and their events.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/communities/discover">
                <Compass className="h-4 w-4 mr-1.5" />
                Discover
              </Link>
            </Button>
            <Button asChild>
              <Link to="/communities/new">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Create community
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-card border animate-pulse" />
            ))}
          </div>
        ) : !communities.length ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-6">
            <p className="font-medium text-lg">No communities yet</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Create a community to bring people together and host events, or discover and join existing ones.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/communities/new">Create your first community</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/communities/discover">Discover communities</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {communities.map((c) => (
              <Link
                key={c._id}
                to={`/communities/${c._id}`}
                className="group flex flex-col rounded-2xl border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 h-full"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {c.name}
                    </h2>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>
                  
                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {c.description}
                    </p>
                  )}
                </div>
                
                <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{c.memberCount ?? c.memberIds?.length ?? 0}</span> members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{c.eventCount ?? 0}</span> events
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
