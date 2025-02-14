import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';

export const tutorialService = {
  async markTutorialAsRead(userId: string, tutorialId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      readTutorials: arrayUnion(tutorialId),
      updatedAt: new Date().toISOString()
    });
  },

  async toggleFavorite(userId: string, tutorialId: string, isFavorite: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: isFavorite ? arrayUnion(tutorialId) : arrayRemove(tutorialId),
      updatedAt: new Date().toISOString()
    });
  },

  async getTutorialProgress(userId: string, tutorialId: string) {
    if (typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { isRead: false, isFavorite: false };
    
    const data = userSnap.data() as UserProfile;
    return {
      isRead: data.readTutorials.includes(tutorialId),
      isFavorite: data.favorites.includes(tutorialId)
    };
  },

  async getTutorialById(tutorialId: string) {
    const docRef = doc(db, 'tutorials', tutorialId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }
}; 