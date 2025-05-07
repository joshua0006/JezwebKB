import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ImportArticlesComponent } from '../scripts/importArticles';
import { AlertTriangle } from 'lucide-react';

export function AdminTools() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'admin')) {
      navigate('/login');
    }
  }, [userProfile, loading, navigate]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          <p>This page is only accessible to admin users. Redirecting...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <ImportArticlesComponent />
        </section>
        
        {/* Additional admin tool sections can be added here */}
      </div>
    </div>
  );
} 