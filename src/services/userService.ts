import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, ProfileUpdateData } from '../types/user';
import { FirebaseError } from 'firebase/app';

export const userService = {
  async createUserProfile(
    uid: string, 
    email: string, 
    username: string, 
    photoURL: string | null,
    role: 'user' | 'admin' = 'user'
  ): Promise<void> {
    try {
      const userProfile: UserProfile = {
        uid,
        email,
        username,
        photoURL,
        role: email.endsWith('@jezweb.net') ? 'admin' : role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTutorials: [],
        favorites: []
      };

      await setDoc(doc(db, 'users', uid), userProfile);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'permission-denied':
            throw new Error('Permission denied. Please try logging in again.');
          case 'unavailable':
            throw new Error('Service temporarily unavailable. Please try again later.');
          default:
            console.error('Firestore Error:', error.code, error.message);
            throw new Error('Failed to create user profile');
        }
      }
      throw error;
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'permission-denied':
            throw new Error('Permission denied. Please try logging in again.');
          case 'unavailable':
            throw new Error('Service temporarily unavailable. Please try again later.');
          default:
            console.error('Firestore Error:', error.code, error.message);
            throw new Error('Failed to fetch user profile');
        }
      }
      throw error;
    }
  },

  async updateUserProfile(uid: string, data: ProfileUpdateData): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }
}; 