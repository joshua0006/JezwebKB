import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../Spinner';

interface RequireAuthProps {
  children: React.ReactNode;
  role?: 'admin';
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-8"><Spinner className="w-8 h-8" /></div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // For admin role, strictly check email domain - only jezweb.net emails can access admin pages
  const isAdmin = user.email?.endsWith('@jezweb.net') === true;
  
  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}