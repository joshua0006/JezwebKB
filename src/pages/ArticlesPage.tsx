import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
  slug?: string;
}

// Type guard for Firestore Timestamp
const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

// Helper function to generate a slug from title if it doesn't exist
const getSlug = (article: Article): string => {
  if (article.slug) return article.slug;
  
  return article.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fallbackImage = '/images/jezweb.webp';
  
  const handleImageError = (articleId: string) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }));
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const articlesRef = collection(db, 'articles');
        const articlesQuery = query(
          articlesRef, 
          where('published', '==', true),
          orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(articlesQuery);
        
        const articleData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        
        setArticles(articleData);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Articles...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
        </div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Articles Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Articles</h1>
      
      <div className="grid items-center align-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {articles.map(article => (
          <div
            key={article.id}
            className="bg-white w-[360px] mx-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image Section */}
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={imageErrors[article.id] ? fallbackImage : (article.image || fallbackImage)}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(article.id)}
              />
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Category */}
              <div className="flex items-center space-x-2 mb-4">
                <Link
                  to={`/categories/${article.category}`}
                  className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                >
                  {article.category.charAt(0).toUpperCase() + article.category.slice(1).replace('-', ' ')}
                </Link>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                <Link to={`/article/${article.slug || getSlug(article)}`} className="hover:text-blue-600 line-clamp-1 block">
                  {article.title}
                </Link>
              </h3>

              {/* Description */}
              <p 
                className="text-gray-600 mb-4 line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: article.description || article.content.substring(0, 100).replace(/<[^>]*>/g, '') + '...'
                }}
              ></p>

              {/* Time and Read More Button */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {article.updatedAt ? (
                    <>Updated {format(
                      isFirestoreTimestamp(article.updatedAt) 
                        ? article.updatedAt.toDate() 
                        : new Date(article.updatedAt as unknown as string), 
                      'MMM d, yyyy'
                    )}</>
                  ) : (
                    'Recently updated'
                  )}
                </span>
                <Link
                  to={`/article/${article.slug || getSlug(article)}`}
                  className="flex-shrink-0 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Read More
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-gray-600">Total Articles Available: {articles.length}</p>
      </div>
    </div>
  );
} 