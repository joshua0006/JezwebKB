import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
} 