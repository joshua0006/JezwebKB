import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { Link, useLocation } from 'react-router-dom';
import { EnhancedSearch } from './EnhancedSearch';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, userProfile } = useAuth();
  const location = useLocation();

  // Check if the current path is the SignIn or SignUp page
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);
  
  // Check if user is an admin
  const isAdmin = userProfile?.role === 'admin';

  if (isAuthPage) {
    return null; // Do not render the Navbar on auth pages
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-indigo-600">
                Jezweb Knowledge Base
              </span>
            </Link>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-6">
            <EnhancedSearch className="w-full max-w-lg" />
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white bg-indigo-600 px-4 py-2 rounded-md font-semibold hover:bg-indigo-700">Dashboard</Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-700 rounded-md font-semibold hover:bg-indigo-800"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <UserMenu />
              </>
            ) : (
              <Link
                to="/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}