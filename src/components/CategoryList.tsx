import React from 'react';
import { Layout, Box, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { Category } from '../types';
import { getTutorialsByCategory } from '../data/tutorials';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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

export function CategoryList({ onSelectCategory }: CategoryListProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-4 grid items-end grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-5">
      {categories.map(category => {
        const tutorials = getTutorialsByCategory(category.id);
        const accessibleTutorials = tutorials.filter(tutorial => 
          !tutorial.vipOnly || 
          user?.role === 'admin' || 
          (user?.role === 'vip' && tutorial.vipUsers?.includes(user.id))
        );

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
                  <p className="text-sm text-gray-500">{accessibleTutorials.length} tutorials</p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
