import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequireAuth } from '../components/auth/RequireAuth';
import { HomePage } from '../pages/HomePage';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { TutorialView } from '../pages/TutorialView';
import { CategoryView } from '../pages/CategoryView';
import { AboutUs } from '../pages/AboutUs';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { TermsOfService } from '../pages/TermsOfService';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';
import { NotFound } from '../pages/NotFound';
import { YouTubeSummaryTool } from '../components/YouTubeSummaryTool';
import { AdminDashboard } from '../components/AdminDashboard';
import { UserManagement } from '../components/UserManagement';
import { NotificationManager } from '../components/NotificationManager';
import { AdminLayout } from '../components/AdminLayout';


export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/video-summary" element={<YouTubeSummaryTool />} />

        {/* Tutorial routes */}
        <Route path="/tutorials">
          <Route index element={<Navigate to="/" replace />} />
          <Route path=":tutorialId" element={<TutorialView />} />
        </Route>

        {/* Category routes */}
        <Route path="/categories">
          <Route index element={<Navigate to="/" replace />} />
          <Route path=":categoryId" element={<CategoryView />} />
        </Route>

        {/* Protected user routes */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profile-settings"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout /> 
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="notifications" element={<NotificationManager />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
} 