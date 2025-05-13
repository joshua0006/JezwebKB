import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Layout, Box, FileText, ShoppingBag, ArrowRight,
  Globe, Settings, File, ShoppingCart, Tag,
  BookOpen, Code, Coffee, Database, FileQuestion, Heart, Home, Image, Mail, MessageSquare, Music, 
  Package, Star, User, Video, Zap } from 'lucide-react';
import { format } from 'date-fns';
import ScrollToTopLink from '../components/ScrollToTopLink';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllCategories } from '../services/articleService';

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

// Category type definition
interface CategoryData {
  id: string;
  name: string;
  icon: string;
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

// Map of icon components
const iconComponents: Record<string, any> = {
  // Default mappings
  'wordpress': Layout,
  'elementor': Box,
  'gravity-forms': FileText,
  'shopify': ShoppingBag,
  'general': ArrowRight,
  // Icon name to component mappings
  'tag': Tag,
  'globe': Globe,
  'settings': Settings,
  'file': File,
  'cart': ShoppingCart,
  'book': BookOpen,
  'code': Code,
  'coffee': Coffee,
  'database': Database,
  'fileQuestion': FileQuestion,
  'heart': Heart,
  'home': Home,
  'image': Image,
  'mail': Mail,
  'message': MessageSquare,
  'music': Music,
  'package': Package,
  'star': Star,
  'user': User,
  'video': Video,
  'zap': Zap
};

export function CategoryView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<CategoryData | null>(null);
  const fallbackImage = '/images/jezweb.webp';
  
  const handleImageError = (articleId: string) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }));
  };

  // Fetch category data
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) return;
      
      try {
        const categories = await getAllCategories();
        const matchingCategory = categories.find(cat => cat.id === categoryId);
        
        if (matchingCategory) {
          setCategory({
            id: matchingCategory.id,
            name: matchingCategory.name,
            icon: matchingCategory.icon || 'tag'
          });
        } else {
          // Fallback to formatted category ID if not found
          setCategory({
            id: categoryId,
            name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' '),
            icon: 'tag'
          });
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
        // Fallback if error
        setCategory({
          id: categoryId || '',
          name: categoryId 
            ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')
            : 'Unknown Category',
          icon: 'tag'
        });
      }
    };

    fetchCategoryData();
  }, [categoryId]);

  // Fetch articles in this category
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

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    return iconComponents[iconName] || iconComponents['tag']; // Fallback to Tag icon
  };

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

  // Get category display name and icon component
  const categoryName = category?.name || 'Unknown Category';
  const CategoryIcon = category ? getIconComponent(category.icon) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        {CategoryIcon && (
          <div className="bg-indigo-100 p-3 rounded-lg mr-4">
            <CategoryIcon className="h-6 w-6 text-indigo-600" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">Articles in Category: {categoryName}</h1>
      </div>
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
              <div className="mb-2">
                <Link
                  to={`/categories/${article.category}`}
                  className="text-xs font-medium uppercase text-indigo-600 hover:text-indigo-800"
                >
                  {article.category.charAt(0).toUpperCase() + article.category.slice(1).replace('-', ' ')}
                </Link>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">
                <Link to={`/article/${article.slug || getSlug(article)}`} className="hover:text-blue-600 line-clamp-1 block">
                  {article.title}
                </Link>
              </h3>

              {/* Description */}
              <p 
                className="text-gray-600 mb-4 line-clamp-2 text-left"
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
