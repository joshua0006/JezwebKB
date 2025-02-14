import { Routes, Route } from 'react-router-dom';
import { Home } from '../pages/Home';
import { TutorialView } from '../pages/TutorialView';
import { CategoryView } from '../pages/CategoryView';
import { Dashboard } from '../pages/Dashboard';
import { ProfileSettings } from '../pages/ProfileSettings';
import { RequireAuth } from '../components/auth/RequireAuth';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tutorials/:tutorialId" element={<TutorialView />} />
      <Route path="/categories/:category" element={<CategoryView />} />
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
            <ProfileSettings />
          </RequireAuth>
        }
      />
    </Routes>
  );
} 