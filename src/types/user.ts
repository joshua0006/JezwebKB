export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  photoURL: string | null;
  role: 'user' | 'admin' | 'vip';
  createdAt: string;
  updatedAt: string;
  readTutorials: string[]; // Array of tutorial IDs that the user has read
  favorites: string[]; // Array of tutorial IDs that the user has favorited
  readArticles?: string[]; // Array of article IDs that the user has read/completed
  articleFavorites?: string[]; // Array of article IDs that the user has bookmarked
  // Enhanced article progress tracking
  articleProgress?: {
    [articleId: string]: {
      completed: boolean;
      completedAt?: string;
      lastAccessed: string;
      timeSpent?: number; // Time spent on the article in seconds
    }
  };
  progress: {
    [tutorialId: string]: {
      completed: boolean;
      lastAccessed: string;
      progressPercentage: number;
    }
  };
}

export interface AuthUser extends UserProfile {
  // Additional auth-specific fields can be added here
}

export interface ProfileUpdateData {
  username?: string;
  photoURL?: string | null;
} 