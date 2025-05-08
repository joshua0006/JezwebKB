import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Layout, Box, FileText, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import ScrollToTopLink from '../components/ScrollToTopLink';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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

export function CategoryView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fallbackImage = '/images/jezweb.webp';
  
  const handleImageError = (articleId: string) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }));
  };

  const categoryName = categoryId 
    ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')
    : 'Unknown Category';

  useEffect(() => {
    const fetchArticles = async () => {
      if (!categoryId) return;
      
      setLoading(true);
      try {
        const articlesRef = collection(db, 'articles');
        const articlesQuery = query(articlesRef, where('category', '==', categoryId), where('published', '==', true));
        const querySnapshot = await getDocs(articlesQuery);
        
        const articleData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        
        setArticles(articleData);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Articles...</h1>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Articles Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Define icons for categories
  const categoryIcons = {
    wordpress: <Layout className="h-6 w-6 text-indigo-600" />,
    elementor: <Box className="h-6 w-6 text-indigo-600" />,
    'gravity-forms': <FileText className="h-6 w-6 text-indigo-600" />,
    shopify: <ShoppingBag className="h-6 w-6 text-indigo-600" />,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Articles in Category: {categoryName}</h1>
      <div className="grid items-center align-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {articles.map(article => (
          <div
            key={article.id}
            className="bg-white w-[360px] mx-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image Section */}
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={imageErrors[article.id] ? fallbackImage : (article.image || '/default-article-image.jpg')}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(article.id)}
              />
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                <ScrollToTopLink to={`/article/${article.id}`} className="hover:text-blue-600">
                  {article.title}
                </ScrollToTopLink>
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">
                {article.description || article.content.substring(0, 100).replace(/<[^>]*>/g, '') + '...'}
              </p>

              {/* Time and Read More Button */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {article.updatedAt ? (
                    <>Updated {format(
                      isFirestoreTimestamp(article.updatedAt) 
                        ? article.updatedAt.toDate() 
                        : new Date(article.updatedAt as string), 
                      'MMM d, yyyy'
                    )}</>
                  ) : (
                    'Recently updated'
                  )}
                </span>
                <Link
                  to={`/article/${article.id}`}
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
