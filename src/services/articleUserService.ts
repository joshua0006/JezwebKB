import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';

export const articleUserService = {
  async markArticleAsComplete(userId: string, articleId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      readArticles: arrayUnion(articleId),
      updatedAt: new Date().toISOString()
    });
  },

  async unmarkArticleAsComplete(userId: string, articleId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      readArticles: arrayRemove(articleId),
      updatedAt: new Date().toISOString()
    });
  },

  async toggleArticleBookmark(userId: string, articleId: string, isBookmarked: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      articleFavorites: isBookmarked ? arrayUnion(articleId) : arrayRemove(articleId),
      updatedAt: new Date().toISOString()
    });
  },

  async getArticleUserStatus(userId: string, articleId: string) {
    if (typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { isComplete: false, isBookmarked: false };
    
    const data = userSnap.data() as UserProfile;
    return {
      isComplete: data.readArticles?.includes(articleId) || false,
      isBookmarked: data.articleFavorites?.includes(articleId) || false
    };
  }
}; 