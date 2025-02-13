import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

const DEMO_USERS = {
  admin: {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    favorites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  vip: {
    id: 'vip-1',
    email: 'vip@example.com',
    name: 'VIP User',
    role: 'vip',
    favorites: [],
    assignedTutorials: ['elementor-advanced-techniques'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    favorites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
} as const;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Firebase Auth listener
    const checkAuth = async () => {
      try {
        // Simulate checking auth state
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth state error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Demo user authentication
      const demoUser = Object.values(DEMO_USERS).find(u => u.email === email);
      
      if (!demoUser || password !== 'demo123') {
        throw new Error('Invalid credentials');
      }

      setUser(demoUser as User);
      localStorage.setItem('user', JSON.stringify(demoUser));
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // TODO: Replace with Firebase Auth
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      // TODO: Replace with Firebase update
      if (user) {
        const updatedUser = {
          ...user,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}