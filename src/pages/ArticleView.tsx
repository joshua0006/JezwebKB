import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { Layout, Tag, BookmarkPlus, CheckSquare, Film } from 'lucide-react';
import { ArticleContent } from '../components/ArticleContent';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { isFirestoreTimestamp, timestampToDate, processFirebaseContent } from '../utils/firebaseUtils';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { articleUserService } from '../services/articleUserService';

// HeaderMedia type definition
interface HeaderMedia {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  fileName?: string;
}

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
  slug: string;
  author?: string;
  publicationDate?: string;
  additionalImages?: string[];
  videos?: string[];
  headerMedia?: HeaderMedia | null;
}

// Remove duplicate type guard and utility functions since we're now importing them

// Browser detection for video compatibility
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = '';
  let version = '';
  
  // Safari
  if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'safari';
    version = userAgent.match(/Version\/([\d.]+)/)?.[1] || '';
  }
  // Edge
  else if (userAgent.indexOf('Edg') !== -1) {
    browser = 'edge';
    version = userAgent.match(/Edg\/([\d.]+)/)?.[1] || '';
  }
  // Chrome
  else if (userAgent.indexOf('Chrome') !== -1) {
    browser = 'chrome';
    version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '';
  }
  // Firefox
  else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'firefox';
    version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '';
  }
  // IE
  else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) {
    browser = 'ie';
    version = userAgent.match(/(?:MSIE |rv:)([\d.]+)/)?.[1] || '';
  }
  
  return { browser, version };
};

// Get appropriate video format based on browser
const getVideoFormat = (browser: string) => {
  switch(browser) {
    case 'safari':
      return 'video/mp4';
    case 'firefox':
      return 'video/webm';
    default:
      return 'video/mp4'; // Default to MP4 for most browsers
  }
};

// Check if a video format is supported by the browser
const isVideoFormatSupported = (format: string): boolean => {
  // Create a video element to test compatibility
  const video = document.createElement('video');
  
  // Check if the browser can likely play this type
  return video.canPlayType(format) !== '';
};

// Get an array of supported video formats for the current browser
const getSupportedVideoFormats = (): string[] => {
  const formats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/x-m4v',
    'video/quicktime'
  ];
  
  return formats.filter(format => isVideoFormatSupported(format));
};

export function ArticleView() {
  const { slug } = useParams<{ slug: string }>();
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
  const [mediaError, setMediaError] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{ browser: string; version: string }>({ browser: '', version: '' });
  const fallbackImage = '/images/jezweb.webp';

  // Detect browser on component mount
  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const handleMediaError = () => {
    setMediaError(true);
  };

  // Check if a URL is a video
  const isVideoUrl = (url: string): boolean => {
    return !!url.match(/\.(mp4|webm|ogg|mov)($|\?)/i) || 
           url.includes('firebasestorage.googleapis.com') && 
           url.includes('video');
  };

  // Fetch article and user status
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError('Article slug is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // First try to find by slug
        const articlesCollection = collection(db, 'articles');
        const q = query(articlesCollection, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        // If no results, check if slug might be an article ID (for backward compatibility)
        if (querySnapshot.empty) {
          try {
            // Try to get the article directly by ID
            const articleRef = doc(db, 'articles', slug);
            const articleSnap = await getDoc(articleRef);
            
            if (articleSnap.exists()) {
              const rawData = articleSnap.data();
              
              // Generate a slug for this article
              const title = rawData.title || 'Untitled Article';
              const generatedSlug = title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
              
              // Update the article with the new slug
              await updateDoc(articleRef, { 
                slug: generatedSlug,
                updatedAt: serverTimestamp()
              });
              
              // Redirect to the proper slug URL
              navigate(`/article/${generatedSlug}`, { replace: true });
              return;
            }
          } catch (idError) {
            console.error('Error checking article by ID:', idError);
          }
          
          setError('Article not found');
          setLoading(false);
          return;
        }
        
        const articleDoc = querySnapshot.docs[0];
        const rawData = articleDoc.data();
        
        // Validate required fields
        if (!rawData.title || !rawData.content || !rawData.category) {
          console.error('Article is missing required fields:', rawData);
          setError('Article data is incomplete');
          setLoading(false);
          return;
        }
        
        // Parse and set article data
        const articleData = {
          id: articleDoc.id,
          title: rawData.title || 'Untitled Article',
          content: rawData.content || '',
          category: rawData.category || 'general',
          tags: Array.isArray(rawData.tags) ? rawData.tags : [],
          image: rawData.image || undefined,
          published: Boolean(rawData.published),
          createdAt: rawData.createdAt || Timestamp.now(),
          updatedAt: rawData.updatedAt || Timestamp.now(),
          createdBy: rawData.createdBy || 'unknown',
          description: rawData.description,
          slug: rawData.slug || slug,
          author: rawData.author || '',
          publicationDate: rawData.publicationDate || '',
          additionalImages: Array.isArray(rawData.additionalImages) ? rawData.additionalImages : [],
          videos: Array.isArray(rawData.videos) ? rawData.videos : [],
          headerMedia: rawData.headerMedia || null
        } as Article;
        
        // Check if the featured media is a video
        if (articleData.image) {
          setIsVideo(isVideoUrl(articleData.image));
        }

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
            const status = await articleUserService.getArticleUserStatus(user.uid, articleDoc.id);
            setIsBookmarked(status.isBookmarked);
            setIsCompleted(status.isComplete);
          } catch (statusError) {
            console.error('Error fetching user status:', statusError);
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, setBreadcrumbs, user, userProfile, navigate]);

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    if (!user || !article) return;

    setLoadingBookmark(true);
    try {
      await articleUserService.toggleArticleBookmark(user.uid, article.id, !isBookmarked);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark status:', error);
    } finally {
      setLoadingBookmark(false);
    }
  };

  // Handle completion toggle
  const handleToggleComplete = async () => {
    if (!user || !article) return;

    setLoadingComplete(true);
    try {
      if (isCompleted) {
        await articleUserService.unmarkArticleAsComplete(user.uid, article.id);
      } else {
        await articleUserService.markArticleAsComplete(user.uid, article.id);
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

  // Display the publication date if available, otherwise use the updated date
  const displayDate = article.publicationDate || formattedDate;
  
  // Process content to ensure proper iframe handling
  const processedContent = article.content ? processFirebaseContent(article.content) : '';

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
          {/* Featured Media (Image or Video) */}
          {article.image && (
            <div className="w-full h-60 md:h-80 overflow-hidden">
              {isVideo ? (
                <video 
                  src={mediaError ? fallbackImage : article.image} 
                  controls
                  poster={fallbackImage}
                  className="w-full h-full object-cover" 
                  onError={handleMediaError}
                />
              ) : (
                <img 
                  src={mediaError ? fallbackImage : article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover"
                  onError={handleMediaError}
                />
              )}
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
              <div className="text-sm text-gray-500 flex flex-wrap items-center">
                {article.author && (
                  <>
                    <span className="mr-2">By {article.author}</span>
                    <span className="mx-2">•</span>
                  </>
                )}
                <span>{displayDate}</span>
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
            {processedContent ? (
              <ArticleContent content={processedContent} headerMedia={article.headerMedia} />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}

            {/* Additional Images Gallery */}
            {article.additionalImages && article.additionalImages.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-xl font-semibold mb-4">Gallery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {article.additionalImages.map((imgUrl, index) => (
                    <div key={`img-${index}`} className="relative rounded-lg overflow-hidden h-40">
                      <img 
                        src={imgUrl} 
                        alt={`Additional image ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = fallbackImage;
                          target.classList.add('image-error');
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Collection */}
            {article.videos && article.videos.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-xl font-semibold mb-4">Videos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {article.videos.map((videoUrl, index) => {
                    // Get supported formats and preferred format
                    const supportedFormats = getSupportedVideoFormats();
                    const preferredFormat = getVideoFormat(browserInfo.browser);
                    
                    return (
                      <div key={`video-${index}`} className="relative rounded-lg overflow-hidden">
                        <div className="relative pb-[56.25%] h-0 overflow-hidden">
                          <video 
                            className="absolute top-0 left-0 w-full h-full object-cover rounded-lg quill-video" 
                            poster={fallbackImage}
                            controls
                            preload="metadata"
                            playsInline
                            onLoadedData={(e) => {
                              // Add loaded class when video is loaded successfully
                              const target = e.target as HTMLVideoElement;
                              target.classList.add('video-loaded');
                            }}
                            onError={(e) => {
                              console.error('Video failed to load:', videoUrl);
                              const target = e.target as HTMLVideoElement;
                              target.onerror = null;
                              // Add placeholder or error message
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="flex items-center justify-center h-full min-h-[200px] bg-gray-100 text-gray-500 absolute top-0 left-0 w-full rounded-lg">
                                  <div class="text-center p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p>Video unavailable</p>
                                  </div>
                                </div>`;
                              }
                            }}
                          >
                            {/* Primary source with preferred format */}
                            <source src={videoUrl} type={preferredFormat} />
                            
                            {/* Additional sources for better browser compatibility */}
                            {supportedFormats.map((format, i) => (
                              <source key={`source-${i}`} src={videoUrl} type={format} />
                            ))}
                            
                            {/* Fallback text that will only show if the video element is not supported */}
                            <div className="p-4 bg-gray-100 text-gray-500 flex items-center justify-center min-h-[200px]">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p>Your browser doesn't support HTML5 video.</p>
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-2 inline-block">
                                  View video in new tab
                                </a>
                              </div>
                            </div>
                          </video>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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