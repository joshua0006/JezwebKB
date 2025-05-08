import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bookmark, CheckCircle, Clock, ChevronRight, CheckSquare, BookmarkPlus } from 'lucide-react';
import { userService } from '../services/userService';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { 
  arrayRemove, 
  doc, 
  collection, 
  onSnapshot, 
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { articleUserService } from '../services/articleUserService';
import { getArticleBasicInfo } from '../services/articleService';

interface Article {
  id: string;
  title: string;
  category: string;
  [key: string]: any;
}

interface ArticleInfo {
  id: string;
  title: string;
}

interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
  percentage: number;
}

export function Dashboard() {
  const { user, userProfile } = useAuth();
  const [localUserProfile, setLocalUserProfile] = useState(userProfile);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [articlesByCategory, setArticlesByCategory] = useState<Record<string, Article[]>>({});
  const [articlesInfo, setArticlesInfo] = useState<Record<string, ArticleInfo>>({});
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 0, percentage: 0, totalTimeSpent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Get user profile
  useEffect(() => {
    const refreshData = async () => {
      if (userProfile) {
        try {
          const profile = await userService.getUserProfile(userProfile.uid);
          setLocalUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    refreshData();
  }, [userProfile]);

  // Fetch all articles from Firebase
  useEffect(() => {
    setIsLoading(true);
    const articlesRef = collection(db, 'articles');
    const unsubscribe = onSnapshot(articlesRef, (snapshot) => {
      const articlesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Article;
      });
      
      setArticles(articlesData);
      
      // Group articles by category
      const grouped = articlesData.reduce((acc, article) => {
        const category = article.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(article);
        return acc;
      }, {} as Record<string, Article[]>);
      
      // Count articles by category
      const counts = Object.entries(grouped).reduce((acc, [category, articles]) => {
        acc[category] = articles.length;
        return acc;
      }, {} as Record<string, number>);
      
      setArticlesByCategory(grouped);
      setCategoryCounts(counts);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Calculate progress for each category when articles or user profile changes
  useEffect(() => {
    if (!localUserProfile || !articles.length) return;
    
    try {
      console.log('Calculating category progress with:', {
        articlesCount: articles.length,
        userReadArticles: localUserProfile.readArticles?.length || 0,
        categoryKeys: Object.keys(articlesByCategory)
      });
      
      // Get categories dynamically from the articlesByCategory instead of hardcoding
      const categories = Object.keys(articlesByCategory).filter(category => 
        // Filter out empty categories or non-standard categories if needed
        articlesByCategory[category]?.length > 0
      );
      
      console.log('Available categories:', categories);
      
      const progress = categories.map(category => {
        const allArticles = articlesByCategory[category] || [];
        const completedArticles = localUserProfile.readArticles?.filter(articleId => {
          return allArticles.some(t => t.id === articleId);
        }) || [];

        const total = allArticles.length;
        const completed = completedArticles.length;
        
        console.log(`Category ${category}: ${completed}/${total} completed (${Math.round((completed / total) * 100)}%)`);
        
        return {
          category,
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      });
      
      setCategoryProgress(progress);
      
      // Calculate overall progress across all categories
      const totalArticlesCount = articles.length;
      const totalCompletedCount = localUserProfile.readArticles?.length || 0;
      
      // Calculate total time spent on all articles
      let totalTimeSpent = 0;
      if (localUserProfile.articleProgress) {
        totalTimeSpent = Object.values(localUserProfile.articleProgress).reduce(
          (total, progress) => total + (progress.timeSpent || 0), 
          0
        );
      }
      
      console.log(`Overall progress: ${totalCompletedCount}/${totalArticlesCount} (${Math.round((totalCompletedCount / totalArticlesCount) * 100)}%)`);
      console.log(`Total time spent: ${totalTimeSpent} seconds`);
      
      setOverallProgress({
        completed: totalCompletedCount,
        total: totalArticlesCount,
        percentage: totalArticlesCount > 0 ? Math.round((totalCompletedCount / totalArticlesCount) * 100) : 0,
        totalTimeSpent
      });
    } catch (error) {
      console.error('Error calculating progress:', error);
      // Set empty progress to avoid UI breaking
      setCategoryProgress([]);
      setOverallProgress({ completed: 0, total: 0, percentage: 0, totalTimeSpent: 0 });
    }
  }, [articlesByCategory, localUserProfile, articles]);

  // Fetch article titles for completed and bookmarked articles
  useEffect(() => {
    const fetchArticleInfo = async () => {
      if (!localUserProfile) return;
      
      const articleIds = [
        ...(localUserProfile.readArticles || []),
        ...(localUserProfile.articleFavorites || [])
      ].filter((id, index, self) => self.indexOf(id) === index); // remove duplicates
      
      if (articleIds.length === 0) return;
      
      try {
        const articleData = await getArticleBasicInfo(articleIds);
        setArticlesInfo(articleData);
      } catch (error) {
        console.error('Error fetching articles info:', error);
      }
    };
    
    fetchArticleInfo();
  }, [localUserProfile]);

  const handleRemoveArticle = async (articleId: string, type: 'read' | 'favorite') => {
    if (!user) return;

    try {
      if (type === 'read') {
        await articleService.unmarkArticleAsRead(user.uid, articleId);
        setLocalUserProfile(prev => prev ? {
          ...prev,
          readArticles: prev.readArticles?.filter(id => id !== articleId) || []
        } : null);
      } else {
        await articleService.toggleFavorite(user.uid, articleId, false);
        setLocalUserProfile(prev => prev ? {
          ...prev,
          articleFavorites: prev.articleFavorites?.filter(id => id !== articleId) || []
        } : null);
      }
    } catch (error) {
      console.error('Error removing article:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              Article Progress
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading articles...</p>
              </div>
            ) : (
              <>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryProgress.map((progress) => (
                    <div 
                      key={progress.category} 
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-900">
                          {progress.category} Articles
                          {progress.total === 0 && <span className="text-xs ml-2 text-gray-500">(No articles yet)</span>}
                        </h3>
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            progress.percentage >= 80 ? 'text-green-600' : 
                            progress.percentage >= 40 ? 'text-blue-600' : 
                            'text-gray-600'
                          }`}>
                            {progress.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            progress.percentage >= 80 ? 'bg-green-500' : 
                            progress.percentage >= 40 ? 'bg-blue-600' : 
                            'bg-indigo-400'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {progress.completed} of {progress.total} articles completed
                        </div>
                        {progress.total > 0 && progress.completed < progress.total && (
                          <Link 
                            to={`/categories/${progress.category.toLowerCase()}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            Continue learning
                          </Link>
                        )}
                        {progress.completed === progress.total && progress.total > 0 && (
                          <span className="text-xs font-medium text-green-600">
                            Completed! 🎉
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {categoryProgress.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No categories available or no articles published yet.
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="mt-6 text-center">
              <Link 
                to="/articles" 
                className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center"
              >
                Explore More Articles
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progress Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Learning Progress
            </h2>
            <div className="space-y-4">
              {localUserProfile?.readArticles?.map((articleId) => {
                const article = articles.find(t => t.id === articleId);
                return article ? (
                  <div key={articleId} className="hover:cursor-pointer mb-1 p-1">
                    <Link 
                      to={`/article/${articleId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:text-indigo-600 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </Link>
                  </div>
                ) : null;
              })}
              {!localUserProfile?.readArticles?.length && (
                <div className="text-center py-6 text-gray-500">
                  No completed articles yet
                </div>
              )}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Bookmark className="h-6 w-6 text-yellow-600 mr-2" />
              Favorite Articles
            </h2>
            <div className="space-y-4">
              {localUserProfile?.articleFavorites?.map((articleId) => {
                const article = articles.find(t => t.id === articleId);
                return article ? (
                  <div key={articleId} className="hover:cursor-pointer mb-1 p-1">
                    <Link 
                      to={`/article/${articleId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:text-indigo-600 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                        </div>
                        <Bookmark className="h-5 w-5 text-yellow-500" />
                      </div>
                    </Link>
                  </div>
                ) : null;
              })}
              {!localUserProfile?.articleFavorites?.length && (
                <div className="text-center py-6 text-gray-500">
                  No favorite articles yet
                </div>
              )}
            </div>
          </div>
        </div>

    
      </div>
    </div>
  );
}