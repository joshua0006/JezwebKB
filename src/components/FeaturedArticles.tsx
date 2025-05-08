import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from './ArticleCard';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FeaturedArticlesProps {
  onSelectArticle: (article: Article) => void;
  onViewAll: () => void;
}

export function FeaturedArticles({ onSelectArticle, onViewAll }: FeaturedArticlesProps) {
  const { userProfile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingAll, setViewingAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const DEFAULT_LIMIT = 6;

  useEffect(() => {
    const fetchArticles = async (fetchAll = false) => {
      setLoading(true);
      try {
        let articlesQuery;
        
        // Base query conditions based on user role
        if (!userProfile) {
          // For non-authenticated users, only get non-VIP articles
          articlesQuery = query(
            collection(db, 'articles'),
            where('published', '==', true),
            where('vipOnly', '==', false),
            orderBy('createdAt', 'desc')
          );
        } else if (userProfile.role === 'admin') {
          // Admins can see all articles
          articlesQuery = query(
            collection(db, 'articles'),
            where('published', '==', true),
            orderBy('createdAt', 'desc')
          );
        } else if (userProfile.role === 'vip') {
          // VIP users can see all public and VIP articles
          articlesQuery = query(
            collection(db, 'articles'),
            where('published', '==', true),
            orderBy('createdAt', 'desc')
          );
        } else {
          // Regular users can see only public articles
          articlesQuery = query(
            collection(db, 'articles'),
            where('published', '==', true),
            where('vipOnly', '==', false),
            orderBy('createdAt', 'desc')
          );
        }
        
        // Apply limit only when not viewing all
        if (!fetchAll) {
          articlesQuery = query(articlesQuery, limit(DEFAULT_LIMIT));
        }

        const querySnapshot = await getDocs(articlesQuery);
        
        const fetchedArticles = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            // Convert Firestore timestamp to string
            const createdAt = data.createdAt?.toDate?.() 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString();
            
            const updatedAt = data.updatedAt?.toDate?.() 
              ? data.updatedAt.toDate().toISOString() 
              : new Date().toISOString();
            
            // For VIP users, filter out VIP articles they don't have access to
            if (userProfile?.role === 'vip' && data.vipOnly && data.vipUsers) {
              if (Array.isArray(data.vipUsers) && !data.vipUsers.includes(userProfile.uid)) {
                return null;
              }
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt,
              updatedAt
            } as Article;
          })
          .filter(Boolean) as Article[];

        if (fetchAll) {
          setAllArticles(fetchedArticles);
          setArticles(fetchedArticles);
        } else {
          setArticles(fetchedArticles);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchArticles(viewingAll);
  }, [userProfile, viewingAll]);
  
  const handleViewAll = () => {
    // Save current scroll position
    const scrollPosition = window.scrollY;
    
    setLoadingMore(true);
    setViewingAll(true);
    
    // Restore scroll position after render
    setTimeout(() => {
      if (containerRef.current) {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
      }
    }, 100);
  };
  
  const handleShowLess = () => {
    // Save current scroll position
    const scrollPosition = window.scrollY;
    
    setViewingAll(false);
    
    // Restore scroll position after render
    setTimeout(() => {
      if (containerRef.current) {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
      }
    }, 100);
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
        {userProfile ? (
          viewingAll ? (
            <button 
              onClick={handleShowLess}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
              disabled={loading}
            >
              Show Less
            </button>
          ) : (
            <button 
              onClick={handleViewAll}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
              disabled={loading}
            >
              View All
            </button>
          )
        ) : (
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in to view more
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="col-span-3 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : loadingMore ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="group h-full"
                onClick={() => onSelectArticle(article)}
              >
                <div className="h-full">
                  <ArticleCard article={article} onSelect={onSelectArticle} />
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          </div>
        </>
      ) : error ? (
        <div className="col-span-3 text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length > 0 ? (
              articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className="group h-full"
                  onClick={() => onSelectArticle(article)}
                >
                  <div className="h-full">
                    <ArticleCard article={article} onSelect={onSelectArticle} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No articles available. Please sign in to view more content.</p>
              </div>
            )}
          </div>
          
          {viewingAll && articles.length > DEFAULT_LIMIT && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleShowLess}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
              >
                Show Less
              </button>
            </div>
          )}
          
          {viewingAll && articles.length > 20 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Displaying all {articles.length} articles. Large datasets may affect performance.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}