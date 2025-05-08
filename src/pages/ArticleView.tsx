import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { Layout, Tag, BookmarkPlus, CheckSquare } from 'lucide-react';
import { ArticleContent } from '../components/ArticleContent';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { isFirestoreTimestamp, timestampToDate, processFirebaseContent } from '../utils/firebaseUtils';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { articleUserService } from '../services/articleUserService';

// Article type definition
interface Article {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Remove duplicate type guard and utility functions since we're now importing them

export function ArticleView() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { user, userProfile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fallbackImage = '/images/jezweb.webp';

  const handleImageError = () => {
    setImageError(true);
  };

  // Fetch article and user status
  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError('Article ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const articleRef = doc(db, 'articles', articleId);
        const articleSnap = await getDoc(articleRef);

        if (articleSnap.exists()) {
          const rawData = articleSnap.data();
          
          // Validate required fields
          if (!rawData.title || !rawData.content || !rawData.category) {
            console.error('Article is missing required fields:', rawData);
            setError('Article data is incomplete');
            setLoading(false);
            return;
          }
          
          // Parse and set article data
          const articleData = {
            id: articleSnap.id,
            title: rawData.title || 'Untitled Article',
            content: rawData.content || '',
            category: rawData.category || 'general',
            tags: Array.isArray(rawData.tags) ? rawData.tags : [],
            image: rawData.image || undefined,
            published: Boolean(rawData.published),
            createdAt: rawData.createdAt || Timestamp.now(),
            updatedAt: rawData.updatedAt || Timestamp.now(),
            createdBy: rawData.createdBy || 'unknown',
            description: rawData.description
          } as Article;
          
          setArticle(articleData);
          
          // Set breadcrumbs with Home > Category > Article Title
          const categoryName = articleData.category
            ? articleData.category.charAt(0).toUpperCase() + articleData.category.slice(1).replace('-', ' ')
            : 'Unknown Category';
            
          setBreadcrumbs([
            { label: categoryName, path: `/categories/${articleData.category}` },
            { label: articleData.title }
          ]);

          // Get user status for this article
          if (user && userProfile) {
            try {
              const status = await articleUserService.getArticleUserStatus(user.uid, articleId);
              setIsBookmarked(status.isBookmarked);
              setIsCompleted(status.isComplete);
            } catch (statusError) {
              console.error('Error fetching user status:', statusError);
            }
          }
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, setBreadcrumbs, user, userProfile]);

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    if (!user || !articleId) return;

    setLoadingBookmark(true);
    try {
      await articleUserService.toggleArticleBookmark(user.uid, articleId, !isBookmarked);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark status:', error);
    } finally {
      setLoadingBookmark(false);
    }
  };

  // Handle completion toggle
  const handleToggleComplete = async () => {
    if (!user || !articleId) return;

    setLoadingComplete(true);
    try {
      if (isCompleted) {
        await articleUserService.unmarkArticleAsComplete(user.uid, articleId);
      } else {
        await articleUserService.markArticleAsComplete(user.uid, articleId);
      }
      setIsCompleted(!isCompleted);
    } catch (error) {
      console.error('Error toggling completion status:', error);
    } finally {
      setLoadingComplete(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Article...</h1>
          <div className="animate-pulse w-full h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Article not found'}</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = article.updatedAt 
    ? format(timestampToDate(article.updatedAt), 'MMMM d, yyyy')
    : 'Unknown date';

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
          {/* Featured Image */}
          {article.image && (
            <div className="w-full h-60 md:h-80 overflow-hidden">
              <img 
                src={imageError ? fallbackImage : article.image} 
                alt={article.title} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}
          
          {/* Article Header */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <Layout className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  {article.category.charAt(0).toUpperCase() + article.category.slice(1).replace('-', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Updated on {formattedDate}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            {article.description && (
              <p className="text-lg text-gray-600 mb-6">
                {article.description}
              </p>
            )}
            
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map(tag => (
                  <div key={tag} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <Tag className="h-3 w-3 text-gray-500 mr-1" />
                    <span className="text-xs font-medium text-gray-700">{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Article Content */}
          <div className="p-6 md:p-8 pt-0 md:pt-0 border-t border-gray-100">
            {article.content ? (
              <ArticleContent content={article.content} />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}

            {/* User action buttons - visible to all authenticated users */}
            {user && (
              <div className="mt-8 border-t border-gray-100 pt-6 flex items-center justify-center space-x-12">
                <button
                  onClick={handleToggleBookmark}
                  disabled={loadingBookmark}
                  className={`group flex flex-col items-center transition-colors ${
                    isBookmarked 
                      ? 'text-yellow-600' 
                      : 'text-gray-400 hover:text-yellow-600'
                  }`}
                  aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                >
                  <div className="relative">
                    {loadingBookmark ? (
                      <div className="h-7 w-7 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <BookmarkPlus 
                        className={`h-7 w-7 transform transition-all duration-200 ease-out ${
                          isBookmarked 
                            ? 'text-yellow-600 scale-110' 
                            : 'group-hover:scale-110 group-active:scale-90'
                        }`} 
                      />
                    )}
                    {isBookmarked && !loadingBookmark && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-2 transition-all duration-200 ${isBookmarked ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>
                
                <button
                  onClick={handleToggleComplete}
                  disabled={loadingComplete}
                  className={`group flex flex-col items-center transition-colors ${
                    isCompleted 
                      ? 'text-green-600' 
                      : 'text-gray-400 hover:text-green-600'
                  }`}
                  aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                >
                  <div className="relative">
                    {loadingComplete ? (
                      <div className="h-7 w-7 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <CheckSquare 
                        className={`h-7 w-7 transform transition-all duration-200 ease-out ${
                          isCompleted 
                            ? 'text-green-600 scale-110' 
                            : 'group-hover:scale-110 group-active:scale-90'
                        }`} 
                      />
                    )}
                    {isCompleted && !loadingComplete && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-2 transition-all duration-200 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {isCompleted ? 'Completed' : 'Mark Complete'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </article>
        
        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            ← Back
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
} 