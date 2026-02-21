import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useLoginModalStore } from '@/store/login-modal-store';

type Props = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const location = useLocation();
  const pathname = location.pathname;
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  useEffect(() => {
    if (!isAuthenticated()) {
      openLoginModal(pathname);
    }
  }, [pathname, isAuthenticated, openLoginModal]);

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!profileComplete && pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
