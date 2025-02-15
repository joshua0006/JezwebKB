import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from './UserMenu';
import { ShieldCheck } from 'lucide-react';

export function Navigation() {
  const { userProfile } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              Jezweb KB
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {userProfile?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <ShieldCheck className="w-5 h-5" />
                Admin Dashboard
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
} 