import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginModal } from '@/components/LoginModal';
import SignupPage from '@/pages/SignupPage';
import VerifyPage from '@/pages/VerifyPage';
import LoginPage from '@/pages/LoginPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CreateEventPage from '@/pages/CreateEventPage';
import ProfilePage from '@/pages/ProfilePage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import DiscoverCommunitiesPage from '@/pages/DiscoverCommunitiesPage';
import CreateCommunityPage from '@/pages/CreateCommunityPage';
import EditCommunityPage from '@/pages/EditCommunityPage';
import EditEventPage from '@/pages/EditEventPage';
import CommunityDetailPage from '@/pages/CommunityDetailPage';
import MyRsvpsPage from '@/pages/MyRsvpsPage';
import NotFoundPage from '@/pages/NotFoundPage';

import { HelmetProvider } from 'react-helmet-async';
import { SEO } from '@/components/SEO';

function App() {
  const globalJsonLd = [
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://be-halix.vercel.app",
      "url": "https://be-halix.vercel.app",
      "name": "BeHalix",
      "description": "Create events, join others, and show up. Whatever you're into — find your people on BeHalix.",
      "publisher": {
        "@id": "https://be-halix.vercel.app"
      },
      "inLanguage": "en-US",
    }),
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://be-halix.vercel.app",
      "name": "BeHalix",
      "url": "https://be-halix.vercel.app",
      "logo": "https://be-halix.vercel.app/logo.svg",
    })
  ];

  return (
    <HelmetProvider>
      <SEO 
        title="BeHalix — Where Interests Become Meetups"
        description="Create events, join others, and show up. Whatever you're into — find your people on BeHalix."
        keywords={[
          "Community", "Events", "Meetups", "Networking", "Social", "Local Events", "Groups"
        ]}
        authorName="BeHalix Team"
        creator="BeHalix"
        publisher="BeHalix"
        canonicalUrl="https://be-halix.vercel.app"
        googleVerification="yDjsGMVfcx0Oj-SZUYlj_p1kfaRrq6hH3GR6Ov5Ad3I"
        bingVerification="4DB1FA8D0D94AC428AE1D771607FCC4B"
        jsonLd={globalJsonLd}
      />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<EventsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <CommunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/discover"
          element={
            <ProtectedRoute>
              <DiscoverCommunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/new"
          element={
            <ProtectedRoute>
              <CreateCommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:id/edit"
          element={
            <ProtectedRoute>
              <EditCommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:id"
          element={
            <ProtectedRoute>
              <CommunityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rsvps"
          element={
            <ProtectedRoute>
              <MyRsvpsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <LoginModal />
        <Toaster position="top-center" richColors />
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
