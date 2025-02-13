import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignInForm } from './SignInForm';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'vip';
}

export function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <SignInForm />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}