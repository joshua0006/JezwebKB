import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Article, ArticleFormData } from '../types/article';
import { FirebaseError } from 'firebase/app';
import { UserProfile } from '../types/user';

const COLLECTION_NAME = 'articles';

// Helper function to check authentication
const checkAuth = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated. Please sign in again.');
  }
  return currentUser;
};

// Helper to format Firebase errors
const handleFirebaseError = (error: any) => {
  console.error('Firebase operation failed:', error);
  
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        throw new Error('Permission denied. You do not have access to perform this action.');
      case 'not-found':
        throw new Error('Resource not found.');
      case 'unavailable':
        throw new Error('Service temporarily unavailable. Please try again later.');
      default:
        throw new Error(`Firebase error: ${error.message}`);
    }
  }
  
  throw error;
};

// Convert client date strings to Firestore timestamps
const convertDatesToTimestamps = (data: any) => {
  const result = { ...data };
  
  // Convert string dates to Firestore timestamps
  if (typeof result.createdAt === 'string') {
    try {
      result.createdAt = Timestamp.fromDate(new Date(result.createdAt));
    } catch (e) {
      console.warn('Invalid createdAt date format, using current timestamp', e);
      result.createdAt = serverTimestamp();
    }
  }
  
  if (typeof result.updatedAt === 'string') {
    try {
      result.updatedAt = Timestamp.fromDate(new Date(result.updatedAt));
    } catch (e) {
      console.warn('Invalid updatedAt date format, using current timestamp', e);
      result.updatedAt = serverTimestamp();
    }
  }
  
  return result;
};

// Helper function to generate a URL-friendly slug from a title
export const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim(); // Remove leading/trailing spaces
};

export const createArticle = async (articleData: ArticleFormData, userId: string) => {
  try {
    // Verify user is authenticated
    const currentUser = checkAuth();
    
    // Generate slug from title
    const slug = generateSlugFromTitle(articleData.title);
    
    // Ensure all required fields are present
    const articleWithRequired = {
      ...articleData,
      createdBy: userId,
      // Include any missing required fields with defaults
      title: articleData.title || 'Untitled',
      content: articleData.content || '',
      category: articleData.category || 'general',
      tags: articleData.tags || [],
      published: typeof articleData.published === 'boolean' ? articleData.published : false,
      slug, // Add the slug field
      additionalImages: articleData.additionalImages || [],
      videos: articleData.videos || []
    };
    
    // Ensure timestamps are properly formatted
    const completeArticleData: Record<string, any> = {
      ...articleWithRequired,
      // Override with server timestamps to ensure consistency
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove undefined values to prevent Firestore errors
    Object.keys(completeArticleData).forEach(key => {
      if (completeArticleData[key] === undefined) {
        delete completeArticleData[key];
      }
    });
    
    console.log("Firebase: Creating article with data:", completeArticleData);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), completeArticleData);
    return { id: docRef.id, ...completeArticleData };
  } catch (error) {
    console.error("Error in createArticle:", error);
    throw error; // Let the component handle the error
  }
};

export const updateArticle = async (id: string, articleData: Partial<ArticleFormData>) => {
  try {
    // Verify user is authenticated
    const currentUser = checkAuth();
    
    const articleRef = doc(db, COLLECTION_NAME, id);
    
    // First check if the article exists and the user has rights to modify it
    const docSnap = await getDoc(articleRef);
    if (!docSnap.exists()) {
      throw new Error('Article not found');
    }
    
    // Create update payload with timestamps
    const updateData: Record<string, any> = {
      ...articleData,
      updatedAt: serverTimestamp()
    };
    
    // If title is being updated, regenerate the slug
    if (articleData.title) {
      updateData.slug = generateSlugFromTitle(articleData.title);
    }
    
    // Ensure media arrays are handled properly
    if (articleData.additionalImages) {
      updateData.additionalImages = articleData.additionalImages;
    }
    
    if (articleData.videos) {
      updateData.videos = articleData.videos;
    }
    
    // Remove undefined values to prevent Firestore errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log("Firebase: Updating article with data:", updateData);
    
    await updateDoc(articleRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error("Error in updateArticle:", error);
    throw error; // Let the component handle the error
  }
};

export const deleteArticle = async (id: string) => {
  try {
    // Verify user is authenticated
    const currentUser = checkAuth();
    
    const articleRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(articleRef);
    return true;
  } catch (error) {
    console.error("Error in deleteArticle:", error);
    throw error; // Let the component handle the error
  }
};

export const getArticleById = async (id: string) => {
  try {
    const articleRef = doc(db, COLLECTION_NAME, id);
    const articleSnap = await getDoc(articleRef);
    
    if (articleSnap.exists()) {
      const articleData = articleSnap.data();
      
      // Ensure the content is properly formatted for display in the editor
      // This helps with encoded HTML entities and other potential formatting issues
      const processedContent = articleData.content || '';
      
      // Process Firestore timestamps into string dates for the frontend
      // This ensures consistent data structure when editing
      const createdAt = articleData.createdAt instanceof Timestamp 
        ? articleData.createdAt.toDate().toISOString() 
        : articleData.createdAt;
        
      const updatedAt = articleData.updatedAt instanceof Timestamp 
        ? articleData.updatedAt.toDate().toISOString() 
        : articleData.updatedAt;
      
      // Ensure media arrays are properly handled
      const additionalImages = Array.isArray(articleData.additionalImages) 
        ? articleData.additionalImages 
        : [];
        
      const videos = Array.isArray(articleData.videos) 
        ? articleData.videos 
        : [];
      
      return { 
        id: articleSnap.id, 
        ...articleData,
        content: processedContent,
        createdAt,
        updatedAt,
        additionalImages,
        videos
      } as Article;
    } else {
      throw new Error('Article not found');
    }
  } catch (error) {
    console.error("Error in getArticleById:", error);
    throw error; // Let the component handle the error
  }
};

export const getAllArticles = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Format timestamps to ISO strings for frontend use
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt;
        
      const updatedAt = data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : data.updatedAt;
      
      // Ensure media arrays are properly handled
      const additionalImages = Array.isArray(data.additionalImages) 
        ? data.additionalImages 
        : [];
        
      const videos = Array.isArray(data.videos) 
        ? data.videos 
        : [];
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        additionalImages,
        videos
      };
    }) as Article[];
  } catch (error) {
    console.error("Error in getAllArticles:", error);
    throw error; // Let the component handle the error
  }
};

export const getArticlesByCategory = async (category: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Format timestamps to ISO strings for frontend use
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt;
        
      const updatedAt = data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : data.updatedAt;
      
      // Ensure media arrays are properly handled
      const additionalImages = Array.isArray(data.additionalImages) 
        ? data.additionalImages 
        : [];
        
      const videos = Array.isArray(data.videos) 
        ? data.videos 
        : [];
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        additionalImages,
        videos
      };
    }) as Article[];
  } catch (error) {
    console.error("Error in getArticlesByCategory:", error);
    throw error; // Let the component handle the error
  }
};

export const getArticleBasicInfo = async (articleIds: string[]) => {
  try {
    if (!articleIds.length) return {};
    
    const articleData: Record<string, { id: string; title: string }> = {};
    
    for (const id of articleIds) {
      try {
        const articleRef = doc(db, COLLECTION_NAME, id);
        const articleSnap = await getDoc(articleRef);
        
        if (articleSnap.exists()) {
          const data = articleSnap.data();
          articleData[id] = {
            id,
            title: data.title || 'Untitled Article'
          };
        }
      } catch (error) {
        console.error(`Error fetching article ${id}:`, error);
      }
    }
    
    return articleData;
  } catch (error) {
    console.error("Error in getArticleBasicInfo:", error);
    return {};
  }
};

export const articleService = {
  async markArticleAsRead(userId: string, articleId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const now = new Date().toISOString();
    
    try {
      // First check if the article is already in the progress tracking
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      
      await updateDoc(userRef, {
        readArticles: arrayUnion(articleId),
        [`articleProgress.${articleId}`]: {
          completed: true,
          completedAt: now,
          lastAccessed: now,
          timeSpent: userData?.articleProgress?.[articleId]?.timeSpent || 0
        },
        updatedAt: now
      });
    } catch (error) {
      console.error('Error marking article as read:', error);
      throw error;
    }
  },

  async toggleFavorite(userId: string, articleId: string, isFavorite: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      articleFavorites: isFavorite ? arrayUnion(articleId) : arrayRemove(articleId),
      updatedAt: new Date().toISOString()
    });
  },

  async getArticleProgress(userId: string, articleId: string) {
    if (typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { isRead: false, isFavorite: false };
    
    const data = userSnap.data() as UserProfile;
    return {
      isRead: data.readArticles?.includes(articleId) || false,
      isFavorite: data.articleFavorites?.includes(articleId) || false
    };
  },

  async getArticleById(articleId: string) {
    const docRef = doc(db, 'articles', articleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async unmarkArticleAsRead(userId: string, articleId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    try {
      // Get the existing progress data to keep it even though we're unmarking as read
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      
      await updateDoc(userRef, {
        readArticles: arrayRemove(articleId),
        [`articleProgress.${articleId}.completed`]: false,
        [`articleProgress.${articleId}.completedAt`]: null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unmarking article as read:', error);
      throw error;
    }
  },

  async updateArticleProgress(userId: string, articleId: string, timeSpent: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const now = new Date().toISOString();
    
    try {
      // Get existing progress data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      const currentTimeSpent = userData?.articleProgress?.[articleId]?.timeSpent || 0;
      
      await updateDoc(userRef, {
        [`articleProgress.${articleId}`]: {
          completed: userData?.articleProgress?.[articleId]?.completed || false,
          completedAt: userData?.articleProgress?.[articleId]?.completedAt || null,
          lastAccessed: now,
          timeSpent: currentTimeSpent + timeSpent
        },
        updatedAt: now
      });
    } catch (error) {
      console.error('Error updating article progress:', error);
      throw error;
    }
  }
};

// Utility function to backfill slugs for existing articles
export const backfillSlugsForArticles = async () => {
  try {
    // Verify user is authenticated
    const currentUser = checkAuth();
    
    // Get all articles
    const articlesRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(articlesRef);
    
    let updatedCount = 0;
    
    // For each article without a slug, generate one and update
    for (const doc of querySnapshot.docs) {
      const articleData = doc.data();
      
      // Skip if already has a slug
      if (articleData.slug) continue;
      
      // Generate a slug from the title
      const title = articleData.title || 'untitled';
      const slug = generateSlugFromTitle(title);
      
      // Update the document with the new slug
      const articleRef = doc.ref;
      await updateDoc(articleRef, { 
        slug,
        updatedAt: serverTimestamp()
      });
      
      updatedCount++;
    }
    
    return { 
      success: true, 
      message: `Updated ${updatedCount} articles with slugs`,
      updatedCount
    };
  } catch (error) {
    console.error("Error in backfillSlugsForArticles:", error);
    throw error;
  }
}; 