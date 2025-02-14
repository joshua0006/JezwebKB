import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    console.log('Loading...');
    return <div>Loading...</div>; // Or your loading spinner component
  }

  if (!user) {
    console.log('User not authenticated, redirecting to login...');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('User is authenticated:', user);

  return <>{children}</>;
}