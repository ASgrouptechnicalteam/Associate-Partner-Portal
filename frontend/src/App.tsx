import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PwaProvider } from './context/PwaContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { Loader } from './components/ui/Loader';

// Eagerly loaded critical paths
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/errors/NotFound';
import AccessDenied from './pages/errors/AccessDenied';
import ForcePasswordChange from './pages/auth/ForcePasswordChange';
import PublicReviewForm from './pages/reviews/PublicReviewForm';

// Lazy loaded secondary modules
const Users = React.lazy(() => import('./pages/users/Users'));
const CreateUser = React.lazy(() => import('./pages/users/CreateUser'));
const EditUser = React.lazy(() => import('./pages/users/EditUser'));
const UserDetails = React.lazy(() => import('./pages/users/UserDetails'));
const Projects = React.lazy(() => import('./pages/projects/Projects'));
const CreateProject = React.lazy(() => import('./pages/projects/CreateProject'));
const ProjectDetails = React.lazy(() => import('./pages/projects/ProjectDetails'));
const BookingsList = React.lazy(() => import('./pages/bookings/BookingsList'));
const Commissions = React.lazy(() => import('./pages/commissions/Commissions'));
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const BookingDetails = React.lazy(() => import('./pages/bookings/BookingDetails'));
const CreateBooking = React.lazy(() => import('./pages/bookings/CreateBooking'));
const TeamHierarchy = React.lazy(() => import('./pages/team/TeamHierarchy'));
const PendingAuthorizations = React.lazy(() => import('./pages/authorizations/PendingAuthorizations'));
const SiteVisitList = React.lazy(() => import('./pages/site-visits/SiteVisitList'));
const CreateSiteVisit = React.lazy(() => import('./pages/site-visits/CreateSiteVisit'));
const SiteVisitDetails = React.lazy(() => import('./pages/site-visits/SiteVisitDetails'));
const DemoBookingsList = React.lazy(() => import('./pages/demo-bookings/DemoBookingsList'));
const CreateDemoBooking = React.lazy(() => import('./pages/demo-bookings/CreateDemoBooking'));
const DemoBookingDetails = React.lazy(() => import('./pages/demo-bookings/DemoBookingDetails'));
const OffersList = React.lazy(() => import('./pages/offers/OffersList'));
const CreateOffer = React.lazy(() => import('./pages/offers/CreateOffer'));
const EditOffer = React.lazy(() => import('./pages/offers/EditOffer'));
const CarouselManager = React.lazy(() => import('./pages/cms/CarouselManager'));
const PopupManager = React.lazy(() => import('./pages/cms/PopupManager'));
const ReviewRequests = React.lazy(() => import('./pages/reviews/ReviewRequests'));
const ReviewAnalytics = React.lazy(() => import('./pages/reviews/ReviewAnalytics'));
const Notifications = React.lazy(() => import('./pages/notifications/Notifications'));
const FaqPage = React.lazy(() => import('./pages/help/Faq'));
const FaqManager = React.lazy(() => import('./pages/cms/FaqManager'));
const InventoryList = React.lazy(() => import('./pages/inventory/InventoryList'));

function App() {
  return (
    <PwaProvider>
      <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-app-background"><Loader size={32} text="Loading module..." /></div>}>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/public/reviews/:token" element={<PublicReviewForm />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/force-password-change" 
            element={
              <ProtectedRoute>
                <ForcePasswordChange />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Users />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateUser />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EditUser />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Projects />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InventoryList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateProject />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TeamHierarchy />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/access-denied"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AccessDenied />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Bookings */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BookingsList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateBooking />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BookingDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Commissions */}
          <Route
            path="/commissions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Commissions />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Pending Authorizations */}
          <Route
            path="/authorizations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PendingAuthorizations />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Site Visits */}
          <Route
            path="/site-visits"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SiteVisitList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/site-visits/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateSiteVisit />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/site-visits/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SiteVisitDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/demo-bookings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DemoBookingsList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/demo-bookings/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateDemoBooking />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/demo-bookings/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DemoBookingDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Offers */}
          <Route
            path="/offers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <OffersList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateOffer />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers/:id/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EditOffer />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* CMS */}
          <Route
            path="/cms/carousel"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CarouselManager />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cms/popup"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PopupManager />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cms/faq"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FaqManager />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route path="notifications" element={<Notifications />} />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Reviews */}
          <Route
            path="/reviews/requests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReviewRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReviewAnalytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Help & Tutorials */}
          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FaqPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </PwaProvider>
  );
}

export default App;
