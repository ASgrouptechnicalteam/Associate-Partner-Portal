import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PwaProvider } from './context/PwaContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import ForcePasswordChange from './pages/auth/ForcePasswordChange';
import Dashboard from './pages/dashboard/Dashboard';
import Users from './pages/users/Users';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';
import UserDetails from './pages/users/UserDetails';
import NotFound from './pages/errors/NotFound';
import AccessDenied from './pages/errors/AccessDenied';
import AppLayout from './components/layout/AppLayout';
import Projects from './pages/projects/Projects';
import CreateProject from './pages/projects/CreateProject';
import ProjectDetails from './pages/projects/ProjectDetails';
import BookingsList from './pages/bookings/BookingsList';
import Commissions from './pages/commissions/Commissions';
import Profile from './pages/profile/Profile';
import BookingDetails from './pages/bookings/BookingDetails';
import CreateBooking from './pages/bookings/CreateBooking';
import TeamHierarchy from './pages/team/TeamHierarchy';
import TravelList from './pages/travel/TravelList';
import CreateTravel from './pages/travel/CreateTravel';
import TravelDetails from './pages/travel/TravelDetails';
import PendingAuthorizations from './pages/authorizations/PendingAuthorizations';
import SiteVisitList from './pages/site-visits/SiteVisitList';
import CreateSiteVisit from './pages/site-visits/CreateSiteVisit';
import SiteVisitDetails from './pages/site-visits/SiteVisitDetails';
import OffersList from './pages/offers/OffersList';
import CreateOffer from './pages/offers/CreateOffer';
import EditOffer from './pages/offers/EditOffer';
import CarouselManager from './pages/cms/CarouselManager';
import PopupManager from './pages/cms/PopupManager';
import ReviewRequests from './pages/reviews/ReviewRequests';
import ReviewAnalytics from './pages/reviews/ReviewAnalytics';
import PublicReviewForm from './pages/reviews/PublicReviewForm';
import Notifications from './pages/notifications/Notifications';
import FaqPage from './pages/help/Faq';
import FaqManager from './pages/cms/FaqManager';

function App() {
  return (
    <PwaProvider>
      <AuthProvider>
      <BrowserRouter>
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

          {/* Travel Allowance */}
          <Route
            path="/travel"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TravelList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/travel/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateTravel />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/travel/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TravelDetails />
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
      </BrowserRouter>
    </AuthProvider>
    </PwaProvider>
  );
}

export default App;
