import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { CommunityListItem } from '@/types/community';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DiscoverCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ communities: CommunityListItem[] }>('/communities/discover')
      .then(({ data }) => setCommunities(data.communities ?? []))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8">
        <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground hover:text-foreground">
              <Link to="/communities" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to my communities
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
                <p className="text-muted-foreground">Find new communities to join</p>
              </div>
            </div>
        </div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48" />
                ))}
             </div>
        ) : !communities.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card">
              <p className="text-muted-foreground">No communities found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((c) => (
              <Card key={c._id} className="flex flex-col h-full hover:shadow-md transition-all duration-200 border-transparent hover:border-primary/20 shadow-sm group">
                  <Link to={`/communities/${c._id}`} className="flex-1">
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors text-xl">{c.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-1">/{c.slug}</p>
                      {c.description && (
                        <CardDescription className="line-clamp-2 mt-2">{c.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Link>
                  <CardContent className="pt-0 mt-auto">
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                           <Users className="h-3.5 w-3.5" />
                           {c.memberCount ?? c.memberIds?.length ?? 0} members
                           {c.isMember && <span className="ml-1 font-medium text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">Member</span>}
                        </span>
                        {!c.isMember && (
                           <Button asChild size="sm" variant="secondary" className="h-8">
                             <Link to={`/communities/${c._id}`}>View</Link>
                           </Button>
                        )}
                    </div>
                  </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
