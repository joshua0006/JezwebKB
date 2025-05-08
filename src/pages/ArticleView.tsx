import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { Layout, Tag } from 'lucide-react';
import { ArticleContent } from '../components/ArticleContent';
import { useBreadcrumbs } from '../context/BreadcrumbContext';

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

// Type guard for Firestore Timestamp
const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

// Utility function to safely decode HTML content before displaying
const decodeHtmlEntities = (html: string): string => {
  if (!html) return '';
  
  // Create a textarea element to safely decode HTML entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = html;
  const decodedContent = textArea.value;
  
  // Clean up
  textArea.remove();
  
  return decodedContent;
};

// Add a utility to sanitize HTML content as a fallback
const sanitizeHtml = (html: string): string => {
  try {
    // This is a simple sanitizer, in a real app you'd use a library like DOMPurify
    // Strip out any potentially dangerous elements/attributes
    const clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
    return clean;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return html; // Return the original if sanitization fails
  }
};

export function ArticleView() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;

      setLoading(true);
      try {
        const articleRef = doc(db, 'articles', articleId);
        const articleSnap = await getDoc(articleRef);

        if (articleSnap.exists()) {
          const articleData = {
            id: articleSnap.id,
            ...articleSnap.data()
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
          
          // Process content for display
          if (articleData.content) {
            try {
              // Decode and sanitize content
              const decodedContent = decodeHtmlEntities(articleData.content);
              const sanitizedContent = sanitizeHtml(decodedContent);
              
              // Fix any empty paragraphs that might have been created
              const cleanedContent = sanitizedContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
              
              setProcessedContent(cleanedContent);
            } catch (contentError) {
              console.error('Error processing article content:', contentError);
              setProcessedContent(articleData.content);
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
  }, [articleId, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Article...</h1>
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
    ? format(
        isFirestoreTimestamp(article.updatedAt) 
          ? article.updatedAt.toDate() 
          : new Date(article.updatedAt as unknown as string), 
        'MMMM d, yyyy'
      )
    : 'Unknown date';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        {/* Featured Image */}
        {article.image && (
          <div className="w-full h-60 md:h-80 overflow-hidden">
            <img 
              src={article.image} 
              alt={article.title} 
              className="w-full h-full object-cover"
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
          {processedContent ? (
            <ArticleContent content={processedContent} />
          ) : (
            <p className="text-gray-500 italic">No content available</p>
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
  );
} 