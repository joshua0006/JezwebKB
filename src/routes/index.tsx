import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequireAuth } from '../components/auth/RequireAuth';
import { HomePage } from '../pages/HomePage';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { TutorialView } from '../pages/TutorialView';
import { CategoryView } from '../pages/CategoryView';
import { ArticleView } from '../pages/ArticleView';
import { ArticlesPage } from '../pages/ArticlesPage';
import { AboutUs } from '../pages/AboutUs';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { TermsOfService } from '../pages/TermsOfService';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';
import { NotFound } from '../pages/NotFound';
import { SearchResults } from '../pages/SearchResults';
import { YouTubeSummaryTool } from '../components/YouTubeSummaryTool';
import { AdminDashboard } from '../components/AdminDashboard';
import { UserManagement } from '../components/UserManagement';
import { NotificationManager } from '../components/NotificationManager';
import { AdminLayout } from '../components/AdminLayout';
import { ArticleManager } from '../components/ArticleManager';

import { ArticleCreator } from '../components/ArticleCreator';
import { EditArticle } from '../components/EditArticle';
import { AdminTools } from '../pages/AdminTools';


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
        <Route path="/search" element={<SearchResults />} />

        {/* Article routes */}
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/article/:slug" element={<ArticleView />} />

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
          <Route path="articles" element={<ArticleManager />} /> 
          <Route path="articles/create" element={<ArticleCreator />} />
          <Route path="articles/:id/edit-new" element={<EditArticle />} />
          <Route path="tools" element={<AdminTools />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
} 