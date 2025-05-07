import React, { useState, useEffect } from 'react';
import { Layout, Box, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { Category, Tutorial } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CategoryItem {
  id: Category;
  name: string;
  icon: any;
}

const categories: CategoryItem[] = [
  { id: 'wordpress', name: 'WordPress', icon: Layout },
  { id: 'elementor', name: 'Elementor', icon: Box },
  { id: 'gravity-forms', name: 'Gravity Forms', icon: FileText },
  { id: 'shopify', name: 'Shopify', icon: ShoppingBag },
];

interface CategoryListProps {
  onSelectCategory: (category: Category) => void;
}

interface FirebaseArticle {
  id: string;
  title: string;
  category: Category;
  vipOnly?: boolean;
  vipUsers?: string[];
  published?: boolean;
}

export function CategoryList({ onSelectCategory }: CategoryListProps) {
  const { user, userProfile } = useAuth();
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchArticleCounts = async () => {
      setLoading(true);
      const counts: Record<string, number> = {};
      
      try {
        for (const category of categories) {
          const articlesRef = collection(db, 'articles');
          const q = query(
            articlesRef, 
            where('category', '==', category.id),
            where('published', '==', true)
          );
          const querySnapshot = await getDocs(q);
          
          const articles = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as FirebaseArticle[];
          
          const accessibleArticles = articles.filter(article => 
            !article.vipOnly || 
            userProfile?.role === 'admin' || 
            (userProfile?.role === 'vip' && article.vipUsers?.includes(userProfile?.uid || ''))
          );
          
          counts[category.id] = accessibleArticles.length;
        }
        
        setArticleCounts(counts);
      } catch (error) {
        console.error("Error fetching article counts:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticleCounts();
  }, [userProfile]);

  // Skeleton for the count while loading
  const CountSkeleton = () => (
    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded-md"></div>
  );

  return (
    <div className="space-y-4 grid items-end grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-5">
      {categories.map(category => {
        return (
          <Link
            key={category.id}
            to={`/categories/${category.id}`}
            className="group flex flex-col justify-center h-full p-4 bg-white rounded-md shadow hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            onClick={() => onSelectCategory(category.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-4 rounded-lg group-hover:bg-indigo-600 transition-colors">
                  <category.icon className="h-7 w-7 text-indigo-600 group-hover:text-white transition-transform transform group-hover:scale-110" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {loading ? (
                      <CountSkeleton />
                    ) : (
                      `${articleCounts[category.id] || 0} tutorials`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
