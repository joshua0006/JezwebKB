import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to get initials from name
const getInitials = (name: string | null | undefined) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Helper to get a deterministic color based on the user's name
const getAvatarColor = (name: string | null | undefined) => {
  if (!name) return 'bg-gray-200';
  
  const colors = [
    'bg-red-200 text-red-700',
    'bg-blue-200 text-blue-700',
    'bg-green-200 text-green-700',
    'bg-yellow-200 text-yellow-700',
    'bg-purple-200 text-purple-700',
    'bg-pink-200 text-pink-700',
    'bg-indigo-200 text-indigo-700',
    'bg-teal-200 text-teal-700'
  ];
  
  // Simple hash to determine color
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function UserMenu() {
  const { user, userProfile, logout, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset image error state when user or profile changes
  useEffect(() => {
    setImageError(false);
  }, [user, userProfile]);

  // Check if user has a photoURL from Firebase
  const hasProfilePhoto = Boolean(userProfile?.photoURL);
  
  // Check if user's photo is from Google (contains googleusercontent.com)
  const isGooglePhoto = userProfile?.photoURL?.includes('googleusercontent.com') || false;

  // Load user preference for custom avatar from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('useCustomAvatar');
    if (savedPreference) {
      setUseCustomAvatar(savedPreference === 'true');
    } else if (!hasProfilePhoto) {
      // Default to custom avatar if no photo exists
      setUseCustomAvatar(true);
    }
  }, [hasProfilePhoto]);

  // Toggle between Google photo and custom avatar
  const toggleAvatar = () => {
    const newValue = !useCustomAvatar;
    setUseCustomAvatar(newValue);
    localStorage.setItem('useCustomAvatar', String(newValue));
  };

  const handleImageError = () => {
    console.error('Error loading profile image:', userProfile?.photoURL);
    setImageError(true);
  };

  const initials = getInitials(userProfile?.username || user?.displayName);
  const avatarColor = getAvatarColor(userProfile?.username || user?.displayName);

  // Determine if we should show the profile photo based on all conditions
  const showProfilePhoto = hasProfilePhoto && !useCustomAvatar && !imageError;

  const renderAvatar = () => {
    if (showProfilePhoto) {
      return (
        <img
          src={userProfile?.photoURL || ''}
          alt="Profile"
          className="h-8 w-8 rounded-full object-cover"
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      );
    }
    
    return (
      <div className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center`}>
        <span className="text-sm font-medium">{initials || '?'}</span>
      </div>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div>
        <button
          type="button"
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          onClick={toggleMenu}
        >
          {renderAvatar()}
          <span className="text-sm font-medium">{userProfile?.username || 'Profile'}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <Link
              to="/profile-settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4 inline-block mr-2" />
              Profile Settings
            </Link>
            
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 inline-block mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}