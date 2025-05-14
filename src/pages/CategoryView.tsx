import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Layout, Box, FileText, ShoppingBag, ArrowRight,
  Globe, Settings, File, ShoppingCart, Tag,
  BookOpen, Code, Coffee, Database, FileQuestion, Heart, Home, Image, Mail, MessageSquare, Music, 
  Package, Star, User, Video, Zap, PlayCircle, Clock, Film } from 'lucide-react';
import { format } from 'date-fns';
import ScrollToTopLink from '../components/ScrollToTopLink';
import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllCategories } from '../services/articleService';
import { ArticleCard } from '../components/ArticleCard';

// Article type definition
interface Article {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  videoUrl?: string;
  published: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  createdBy: string;
  slug?: string;
  author?: string;
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

// Check if a URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  return !!url.match(/\.(mp4|webm|ogg|mov)($|\?)/i) || 
         url.includes('firebasestorage.googleapis.com') && 
         url.includes('video');
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
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  const [isVideoMap, setIsVideoMap] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [browserInfo, setBrowserInfo] = useState<{ browser: string; version: string }>({ browser: '', version: '' });
  const fallbackImage = '/images/jezweb.webp';
  
  // Detect browser on component mount
  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const handleMediaError = (articleId: string) => {
    setMediaErrors(prev => ({ ...prev, [articleId]: true }));
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
        
        const articleData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Firestore timestamp to string for compatibility with ArticleCard
          const createdAt = data.createdAt?.toDate?.() 
            ? data.createdAt.toDate().toISOString() 
            : new Date().toISOString();
          
          const updatedAt = data.updatedAt?.toDate?.() 
            ? data.updatedAt.toDate().toISOString() 
            : new Date().toISOString();
            
          return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
            image: data.image || null // Ensure image property exists
          };
        }) as Article[];
        
        // Detect video content for each article
        const videoMap: Record<string, boolean> = {};
        articleData.forEach(article => {
          if (article.videoUrl) {
            videoMap[article.id] = true;
          } else if (article.image) {
            videoMap[article.id] = isVideoUrl(article.image);
          } else {
            videoMap[article.id] = false;
          }
        });
        
        setIsVideoMap(videoMap);
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

  // Handle article selection
  const handleSelectArticle = (article: Article) => {
    navigate(`/article/${article.slug || getSlug(article)}`);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Articles...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        {CategoryIcon && (
          <div className="bg-indigo-100 p-3 rounded-lg mr-4">
            <CategoryIcon className="h-6 w-6 text-indigo-600" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">Articles in Category: {categoryName}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.slug || getSlug(article)}`}
            className="group h-full"
            onClick={(e) => {
              e.preventDefault(); // Prevent default link behavior
              handleSelectArticle(article);
            }}
          >
            <div className="h-full">
              <ArticleCard 
                article={article as any}
                onSelect={handleSelectArticle as any}
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-600">Total Articles Available: {articles.length}</p>
      </div>
    </div>
  );
}
