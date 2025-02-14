import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import { UserProfile } from '../types/user';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile when Firebase user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profile = await userService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      try {
        // Create user profile in Firestore with username
        await userService.createUserProfile(
          userCredential.user.uid, 
          email,
          username,
          null
        );
        
        // Load the created profile
        const profile = await userService.getUserProfile(userCredential.user.uid);
        setUserProfile(profile);
      } catch (error) {
        // If Firestore operations fail, delete the auth user
        await userCredential.user.delete();
        throw error;
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('Email already exists');
          case 'auth/invalid-email':
            throw new Error('Invalid email address');
          case 'auth/operation-not-allowed':
            throw new Error('Email/Password sign up is not enabled. Please contact support.');
          case 'auth/weak-password':
            throw new Error('Password should be at least 6 characters');
          case 'auth/network-request-failed':
            throw new Error('Network error. Please check your internet connection.');
          default:
            console.error('Firebase Auth Error:', error.code, error.message);
            throw new Error(`Authentication error: ${error.message}`);
        }
      }
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Load user profile
      const profile = await userService.getUserProfile(userCredential.user.uid);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, ...profile });
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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