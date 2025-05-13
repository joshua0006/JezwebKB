import React, { useState, useEffect } from 'react';
import { Layout, Box, FileText, ShoppingBag, ArrowRight, 
  // Add more icons needed for categories
  Globe, Settings, File, ShoppingCart, Tag,
  BookOpen, Code, Coffee, Database, FileQuestion, Heart, Home, Image, Mail, MessageSquare, Music, 
  Package, Star, User, Video, Zap } from 'lucide-react';
import { Category, Tutorial } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllCategories } from '../services/articleService';

interface CategoryItem {
  id: Category;
  name: string;
  icon: string;
}

// Map of available icons for rendering
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
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  
  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        if (fetchedCategories.length > 0) {
          const categoriesWithIcons = fetchedCategories.map(category => ({
            id: category.id,
            name: category.name,
            icon: category.icon || 'tag' // Use the icon name from Firebase
          }));
          setCategories(categoriesWithIcons);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const fetchArticleCounts = async () => {
      if (categories.length === 0) return;
      
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
  }, [categories, userProfile]);

  // Skeleton for the count while loading
  const CountSkeleton = () => (
    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded-md"></div>
  );

  // Get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    return iconComponents[iconName] || iconComponents['tag']; // Fallback to Tag icon
  };

  return (
    <div className="space-y-4 grid items-end grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-5">
      {categories.map(category => {
        // Get the icon component based on the icon name
        const IconComponent = getIconComponent(category.icon);
        
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
                  <IconComponent className="h-7 w-7 text-indigo-600 group-hover:text-white transition-transform transform group-hover:scale-110" />
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
