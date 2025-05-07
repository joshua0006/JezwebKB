import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, Bell, BookOpen, FileText } from 'lucide-react';
import { NotificationManager } from './NotificationManager';
import { Spinner } from './Spinner';

export function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTutorials: 0,
    totalArticles: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        // Get active tutorials (published and not archived)
        const tutorialsQuery = query(
          collection(db, 'tutorials'),
          where('status', '==', 'published'),
          where('archived', '==', false)
        );
        const tutorialsSnapshot = await getDocs(tutorialsQuery);

        // Get articles count
        const articlesQuery = query(collection(db, 'articles'));
        const articlesSnapshot = await getDocs(articlesQuery);

        setStats({
          totalUsers: usersSnapshot.size,
          activeTutorials: tutorialsSnapshot.size,
          totalArticles: articlesSnapshot.size,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (userProfile?.role === 'admin') {
      fetchStats();
    }
  }, [userProfile]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userProfile?.username}
          <span className="ml-2 text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
            Admin
          </span>
        </h1>
      </div>

      {stats.loading ? (
        <div className="text-center py-8">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to="/admin/users"
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg"
              >
                <Users className="w-5 h-5" />
                Manage Users
              </Link>
              <Link 
                to="/admin/notifications"
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                Send Notifications
              </Link>
              <Link 
                to="/admin/articles"
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg"
              >
                <FileText className="w-5 h-5" />
                Manage Articles
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">System Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Users
                </span>
                <span className="font-semibold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Active Tutorials
                </span>
                <span className="font-semibold">{stats.activeTutorials}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Articles
                </span>
                <span className="font-semibold">{stats.totalArticles}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 