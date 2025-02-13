import React from 'react';
import { LayoutGrid, FileText, Settings, LogOut, Tag, FolderTree, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath.endsWith(path)
      ? 'bg-indigo-50 text-indigo-600'
      : 'text-gray-700 hover:bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('')}`}
          >
            <LayoutGrid className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Overview
          </Link>
          <Link
            to="/dashboard/tutorials"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('tutorials')}`}
          >
            <FileText className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Tutorials
          </Link>
          <Link
            to="/dashboard/categories"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('categories')}`}
          >
            <FolderTree className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Categories
          </Link>
          <Link
            to="/dashboard/tags"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('tags')}`}
          >
            <Tag className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Tags
          </Link>
          <Link
            to="/dashboard/users"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('users')}`}
          >
            <Users className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Users
          </Link>
          <Link
            to="/dashboard/settings"
            className={`flex items-center px-4 py-2 rounded-md group ${isActive('settings')}`}
          >
            <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <button className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md group w-full">
            <LogOut className="h-5 w-5 mr-3 text-gray-400 group-hover:text-indigo-600" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h2 className="text-lg font-medium text-gray-900">Dashboard</h2>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}