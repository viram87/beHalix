import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
          <p className="text-muted-foreground">Page not found.</p>
          <Button asChild>
            <Link to="/events">Go to Events</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
