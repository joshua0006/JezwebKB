import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import { UserProfile } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user profile when Firebase user changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user); // Always update user state
      if (user) {
        console.log('Auth state changed - user logged in:', user.uid);
        try {
          await fetchUserProfile(user);
        } catch (error) {
          console.error('Failed to load profile:', error);
          await auth.signOut();
        }
      } else {
        console.log('User logged out');
        setUserProfile(null);
      }
      setLoading(false); // Ensure loading is always false after auth check
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (user: FirebaseUser) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        let userData = docSnap.data() as UserProfile;
        
        // Immediate role update check
        const isJezwebAdmin = user.email?.endsWith('@jezweb.net');
        if (isJezwebAdmin && userData.role !== 'admin') {
          await updateDoc(docRef, { role: 'admin' });
          userData = { ...userData, role: 'admin' };
        }
        
        setUserProfile(userData);
        // Redirect immediately after profile update
        if (userData.role === 'admin' || isJezwebAdmin) {
          navigate('/admin');
        }
      } else {
        const role = user.email?.endsWith('@jezweb.net') ? 'admin' : 'user';
        await userService.createUserProfile(
          user.uid,
          user.email || '',
          user.displayName || 'New User',
          user.photoURL,
          role
        );
        
        const newDoc = await getDoc(docRef);
        const newUserData = newDoc.data() as UserProfile;
        setUserProfile(newUserData);
        
        if (newUserData.role === 'admin') {
          navigate('/admin');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw new Error('Failed to load user profile');
    }
  };

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
      await fetchUserProfile(userCredential.user);
    } catch (error) {
      let message = 'Login failed';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            message = 'Invalid email or password';
            break;
          case 'auth/too-many-requests':
            message = 'Account temporarily locked. Try again later';
            break;
        }
      }
      throw new Error(message);
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
      const updatedProfile = { ...userProfile, ...profile };
      setUserProfile(updatedProfile);
      // Optional: Update Firestore if needed
      userService.updateUserProfile(userProfile.uid, updatedProfile);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      const user = auth.currentUser;
      if (user) {
        await fetchUserProfile(user);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error('Google authentication failed. Please try again.');
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    updateProfile,
    signInWithGoogle
  };

  useEffect(() => {
    console.log('Auth Context Update:', {
      user: user?.uid,
      userProfile,
      loading
    });
  }, [user, userProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
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