import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useLoginModalStore } from '@/store/login-modal-store';
import { Avatar } from '@/components/Avatar';
import { Menu, X, Calendar, PlusCircle, Users, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BeHalixLogo } from '@/components/BeHalixLogo';

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const navItems = [
    { href: '/', label: 'Events', icon: Calendar },
    { href: '/create-event', label: 'Create', icon: PlusCircle },
    { href: '/my-rsvps', label: 'My RSVPs', icon: Ticket },
    { href: '/communities', label: 'Communities', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/events');

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href === '/') return;
    if (!isAuthenticated()) {
      e.preventDefault();
      openLoginModal(href);
      closeMenu();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <BeHalixLogo size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item) =>
            isAuthenticated() ? (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link to={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ) : (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                asChild={item.href === '/'}
                onClick={item.href !== '/' ? (e) => handleNavClick(e, item.href) : undefined}
              >
                {item.href === '/' ? (
                  <Link to="/" className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                )}
              </Button>
            )
          )}
          
          <div className="pl-2 border-l ml-2">
            {isAuthenticated() ? (
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link to="/profile" title={user?.email ?? 'Profile'}>
                  <Avatar avatarId={user?.avatarId} displayName={user?.displayName} size="sm" className="ring-2 ring-transparent hover:ring-primary/50 transition-all" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => openLoginModal()}>
                Log in
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-background border-b shadow-lg animate-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) =>
              isAuthenticated() ? (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ) : item.href === '/' ? (
                <Link
                  key={item.href}
                  to="/"
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => { openLoginModal(item.href); closeMenu(); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors w-full text-left",
                    "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            )}
            <div className="h-px bg-border my-2" />
            {isAuthenticated() ? (
              <Link
                to="/profile"
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive('/profile') ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="h-5 w-5" />
                <div className="flex flex-col">
                  <span>My Profile</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => { openLoginModal(); closeMenu(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground w-full text-left"
              >
                <User className="h-5 w-5" />
                Log in
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
