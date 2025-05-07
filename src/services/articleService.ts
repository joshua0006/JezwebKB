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
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Article, ArticleFormData } from '../types/article';
import { FirebaseError } from 'firebase/app';

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

export const createArticle = async (articleData: ArticleFormData, userId: string) => {
  try {
    // Verify user is authenticated
    const currentUser = checkAuth();
    
    // Ensure all required fields are present
    const articleWithRequired = {
      ...articleData,
      createdBy: userId,
      // Include any missing required fields with defaults
      title: articleData.title || 'Untitled',
      content: articleData.content || '',
      category: articleData.category || 'general',
      tags: articleData.tags || [],
      published: typeof articleData.published === 'boolean' ? articleData.published : false
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
      
      return { 
        id: articleSnap.id, 
        ...articleData,
        content: processedContent,
        createdAt,
        updatedAt
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
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
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
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
      };
    }) as Article[];
  } catch (error) {
    console.error("Error in getArticlesByCategory:", error);
    throw error; // Let the component handle the error
  }
}; 