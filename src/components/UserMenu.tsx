import React, { useState } from 'react';
import { User, LogOut, Heart, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <User className="h-5 w-5" />
        <span>{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {user.role === 'vip' && (
              <div className="px-4 py-2 text-sm text-indigo-600 flex items-center">
                <Crown className="h-4 w-4 mr-2" />
                VIP Member
              </div>
            )}
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </a>
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}