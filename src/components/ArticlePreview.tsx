import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArticleFormData } from '../types/article';
import { Category } from '../types/index';
import { ArrowLeft, Calendar } from 'lucide-react';

// Use the same localStorage key as in ArticleCreator
const PREVIEW_STORAGE_KEY = 'articlePreviewData';

// Initial empty state for the article
const emptyArticle: ArticleFormData = {
  title: '',
  content: '',
  category: 'general',
  tags: [],
  published: false,
  author: '',
  publicationDate: '',
  additionalImages: [],
  videos: [],
  headerMedia: null,
};

// Map of category IDs to display names
const defaultCategories: Record<string, string> = {
  'general': 'General',
};

/**
 * ArticlePreview component that displays an article preview in real-time
 * Gets data from localStorage and listens for changes
 */
export const ArticlePreview: React.FC = () => {
  const [articleData, setArticleData] = useState<ArticleFormData>(emptyArticle);
  const [categories, setCategories] = useState<Record<string, string>>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  
  // Define loadArticleData outside of useEffect so it can be referenced by handleMessage
  const loadArticleData = () => {
    if (!initialLoadComplete) {
      setLoading(true);
    }
    setError(null); // Clear previous errors
    
    try {
      // Always use sessionStorage for preview data
      const storedData = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setArticleData(parsedData);
          setLastUpdate(parsedData.lastUpdated || null);
          setInitialLoadComplete(true);
        } catch (parseError) {
          console.error('Error parsing article data:', parseError);
          // Only set error if we've already completed initial load
          if (initialLoadComplete) {
            setError('There was an error parsing the preview data. The data may be corrupted.');
          }
        }
      } else {
        // No data found in storage - only show error if not first load
        // This prevents showing the error during initial window opening
        if (initialLoadComplete) {
          setError('No preview data found. Please return to the editor and try again.');
        }
      }
    } catch (error) {
      console.error('Error loading article preview data:', error);
      // Only show storage access errors if we've already had a successful load
      if (initialLoadComplete) {
        setError('Error accessing preview data. Please return to the editor and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Listen for direct messages from the editor window
  const handleMessage = (event: MessageEvent) => {
    // Handle regular update notification
    if (event.data && event.data.type === 'article-update') {
      // Force immediate refresh when message received
      loadArticleData();
      setForceRefresh(prev => prev + 1);
    }
    
    // Handle direct data updates that bypass storage
    if (event.data && event.data.type === 'article-update-direct' && event.data.articleData) {
      try {
        // Clear any existing errors since we're getting fresh data
        setError(null);
        setInitialLoadComplete(true);
        
        // Show loading state if content is being loaded
        if (event.data.articleData.isLoading) {
          setLoading(true);
        } else {
          setLoading(false);
        }
        
        // Directly use the article data from the message
        setArticleData(event.data.articleData);
        setLastUpdate(event.data.articleData.lastUpdated || null);
        setForceRefresh(prev => prev + 1);
        
        // Also update storage for consistency, but only if storage won't be exceeded
        if (!event.data.articleData.isMinimalVersion) {
          try {
            sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(event.data.articleData));
          } catch (storageError) {
            // Silent fail - we already have the data in memory
            console.log('Could not update session storage, but direct data received');
          }
        }
      } catch (error) {
        console.error('Error handling direct article data:', error);
        setError('Error processing live update from editor. Try refreshing the preview.');
      }
    }
  };

  // Add this new function to send ready messages to the editor window
  const requestFullContent = () => {
    if (window.opener) {
      try {
        // This will signal the editor window that we need the full content
        window.opener.postMessage({
          type: 'request-full-content',
          timestamp: new Date().getTime()
        }, '*');
        
        // Show loading state
        setArticleData(prev => ({
          ...prev,
          isLoading: true
        }));
        
      } catch (e) {
        console.error('Error requesting full content:', e);
      }
    }
  };

  // Load article data from localStorage when component mounts
  useEffect(() => {
    // Load initial data
    loadArticleData();
    
    // Listen for messages from the editor window
    window.addEventListener('message', handleMessage);
    
    // Set up storage event listener to update when localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PREVIEW_STORAGE_KEY && event.newValue) {
        try {
          const updatedData = JSON.parse(event.newValue);
          setArticleData(updatedData);
          setLastUpdate(updatedData.lastUpdated || null);
          setForceRefresh(prev => prev + 1);
          setInitialLoadComplete(true);
        } catch (error) {
          console.error('Error parsing updated article data:', error);
        }
      }
    };
    
    // Tell the opener window that we're ready to receive data
    if (window.opener) {
      try {
        // Send an immediate request for the full content
        window.opener.postMessage({
          type: 'preview-window-ready',
          timestamp: new Date().getTime()
        }, '*');
        
        // Also request full content after a brief delay to ensure the window is fully loaded
        setTimeout(() => {
          requestFullContent();
        }, 300);
      } catch (e) {
        console.error('Error sending ready message to editor window:', e);
      }
    }
    
    // More efficient polling with staggered intervals
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      try {
        // Don't poll if we haven't completed initial load yet
        if (!initialLoadComplete && pollCount < 20) {
          pollCount++;
          return;
        }
        
        // Staggered polling - poll quickly at first, then slow down
        pollCount++;
        if (pollCount > 20 && pollCount % 3 !== 0) {
          return; // Skip some polls after the first 20 iterations
        }
        
        // Always use sessionStorage for preview data
        const storedData = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            // Only update if data has actually changed
            if (parsedData.lastUpdated !== lastUpdate) {
              setArticleData(parsedData);
              setLastUpdate(parsedData.lastUpdated || null);
              // Increment force refresh to ensure UI updates
              setForceRefresh(prev => prev + 1);
              setInitialLoadComplete(true);
            }
          } catch (parseError) {
            console.error('Error parsing data during polling:', parseError);
          }
        }
      } catch (error) {
        console.error('Error polling for article updates:', error);
      }
    }, 300); // Poll at a reasonable frequency
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Set title for the preview window
    document.title = "Article Preview";
    
    // Clean up storage when component unmounts
    const cleanupStorage = () => {
      try {
        // Only clean up if we're the only preview tab
        if (!document.hidden) {
          sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error cleaning up storage:', error);
      }
    };
    
    // Clean up event listener and interval on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
      cleanupStorage();
    };
  }, []);  // Only run this effect once on mount

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
            <span className="font-medium">Preview Error</span>
            <button 
              onClick={() => window.close()} 
              className="text-sm px-2 py-1 bg-red-500 rounded hover:bg-red-700"
            >
              Close Preview
            </button>
          </div>
          
          <div className="p-8">
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <h2 className="text-xl font-bold mb-2">Error Loading Preview</h2>
              <p>{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => window.close()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Return to Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
            <span className="font-medium">Loading Preview...</span>
            <span className="text-sm px-2 py-1 bg-blue-500 rounded">Connecting to editor</span>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Connecting to editor and loading content...</p>
              <p className="text-sm text-gray-500 mt-2">This should only take a moment.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Status bar */}
        <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
          <span className="font-medium">Live Article Preview</span>
          <span className="text-sm px-2 py-1 bg-blue-500 rounded">Auto-updates when edited</span>
        </div>

        <div className="p-8">
          {/* Navigation Back from Preview */}
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => window.close()}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" /> Close Preview
            </button>
          </div>

          {/* Article Header */}
          {articleData.headerMedia && (
            <div className="mb-6">
              {articleData.headerMedia.type === 'image' ? (
                <img 
                  src={articleData.headerMedia.url} 
                  alt={articleData.title} 
                  className="w-full h-80 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={articleData.headerMedia.url} 
                  controls 
                  className="w-full h-80 object-cover rounded-lg"
                />
              )}
            </div>
          )}

          {/* Article Title */}
          <h1 className="text-4xl font-bold mb-4">{articleData.title || "Untitled Article"}</h1>

          {/* Article Metadata */}
          <div className="flex flex-wrap items-center text-gray-600 mb-6 gap-4">
            {articleData.author && (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  {articleData.author.charAt(0).toUpperCase()}
                </div>
                <span>{articleData.author}</span>
              </div>
            )}

            {articleData.publicationDate && (
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>{format(new Date(articleData.publicationDate), 'MMMM d, yyyy')}</span>
              </div>
            )}

            {articleData.category && (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {categories[articleData.category] || articleData.category}
              </div>
            )}
          </div>

          {/* Tags */}
          {articleData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {articleData.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="prose max-w-none" key={`content-${forceRefresh}`}>
            {/* Minimal version banner */}
            {articleData.isMinimalVersion && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                <p className="text-sm">
                  <strong>Note:</strong> This preview shows a minimal version of your article because the content is very large.
                  The editor window contains the full content, and all your edits are being saved.
                </p>
                <button 
                  onClick={() => {
                    if (window.opener) {
                      try {
                        window.opener.postMessage({
                          type: 'request-full-content',
                          timestamp: new Date().getTime()
                        }, '*');
                      } catch (e) {
                        console.error('Error requesting full content:', e);
                      }
                    }
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Request Full Content
                </button>
              </div>
            )}
            
            {/* Loading indicator */}
            {articleData.isLoading && (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="ml-2">Loading latest content...</p>
              </div>
            )}
            
            {/* Truncated content notice */}
            {articleData.content && typeof articleData.content === 'string' && articleData.content.includes("<!-- Content truncated for preview -->") && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                <p className="text-sm">
                  <strong>Note:</strong> This preview shows a truncated version of the article because the content is very large. 
                  The full article will be displayed correctly when published.
                </p>
              </div>
            )}
            
            {/* Render content */}
            {typeof articleData.content === 'string' ? (
              <div 
                dangerouslySetInnerHTML={{ __html: articleData.content }} 
                className={articleData.isLoading ? 'opacity-50' : ''}
              />
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p>No content available for preview.</p>
              </div>
            )}
          </div>
          
          {/* Article Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-gray-600 italic">
              This article {articleData.published ? 'was' : 'will be'} published on {
                articleData.publicationDate && typeof articleData.publicationDate === 'string'
                  ? format(new Date(articleData.publicationDate), 'MMMM d, yyyy')
                  : format(new Date(), 'MMMM d, yyyy')
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 