import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { getTutorialsByCategory } from '../data/tutorials';
import { Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { SEO } from './SEO';
import { Link } from 'react-router-dom';

interface CategoryViewProps {
  category: Category;
  onBack: () => void;
}

export function CategoryView({ category, onBack }: CategoryViewProps) {
  const { user } = useAuth();
  const tutorials = getTutorialsByCategory(category);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fallbackImage = '/images/jezweb.webp';
  
  const handleImageError = (tutorialId: string) => {
    setImageErrors(prev => ({ ...prev, [tutorialId]: true }));
  };
  
  const accessibleTutorials = tutorials.filter(tutorial => 
    !tutorial.vipOnly || 
    user?.role === 'admin' || 
    (user?.role === 'vip' && tutorial.vipUsers?.includes(user.id))
  );
  
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');

  return (
    <div className="space-y-8">
      <SEO 
        title={`${categoryName} Tutorials`}
        description={`Browse our collection of ${accessibleTutorials.length} tutorials about ${categoryName.toLowerCase()}. Learn everything from basics to advanced techniques.`}
      />
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link 
          to="/" 
          className="flex items-center hover:text-indigo-600 transition-colors"
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link 
          to="/tutorials" 
          className="hover:text-indigo-600 transition-colors"
        >
          Tutorials
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">
          {categoryName}
        </span>
      </nav>

      {/* Category Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{categoryName} Tutorials</h1>
        <p className="text-xl text-gray-600">
          Browse all {accessibleTutorials.length} tutorials about {categoryName.toLowerCase()}.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleTutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image Section */}
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={imageErrors[tutorial.id] ? fallbackImage : (tutorial.image || fallbackImage)}
                alt={tutorial.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(tutorial.id)}
              />
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tutorial.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">
                {tutorial.description}
              </p>

              {/* Read More */}
              <Link
                to={`/tutorials/${tutorial.id}`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Read More
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {accessibleTutorials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {user ? 'No tutorials available in this category.' : 'Please sign in to view tutorials in this category.'}
          </p>
        </div>
      )}
    </div>
  );
}