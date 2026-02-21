import { Link } from 'react-router-dom';
import { BeHalixLogo } from '@/components/BeHalixLogo';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <BeHalixLogo size="sm" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Where interests become meetups. Find your people, show up, connect.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse events</Link></li>
              <li><Link to="/communities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Communities</Link></li>
              <li><Link to="/create-event" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Host an event</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My profile</Link></li>
              <li><Link to="/my-rsvps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My RSVPs</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BeHalix. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-brand-pink fill-brand-pink" /> for people who show up
          </p>
        </div>
      </div>
    </footer>
  );
}
