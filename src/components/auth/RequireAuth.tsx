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

  // Check both userProfile role and email domain
  const isAdmin = userProfile?.role === 'admin' || user?.email?.endsWith('@jezweb.net');
  
  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}