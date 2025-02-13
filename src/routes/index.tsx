import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequireAuth } from '../components/auth/RequireAuth';
import { Dashboard } from '../pages/Dashboard';
import { AboutUs } from '../pages/AboutUs';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { TermsOfService } from '../pages/TermsOfService';
import { TutorialView } from '../pages/TutorialView';
import { CategoryView } from '../pages/CategoryView';
import { HomePage } from '../pages/HomePage';
import { NotFound } from '../pages/NotFound';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';

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

        {/* Protected routes */}
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth requiredRole="admin">
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
} 