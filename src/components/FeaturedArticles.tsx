import React from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from './ArticleCard';
import { getSortedTutorials } from '../data/tutorials';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';

interface FeaturedArticlesProps {
  onSelectArticle: (article: Article) => void;
  onViewAll: () => void;
}

export function FeaturedArticles({ onSelectArticle, onViewAll }: FeaturedArticlesProps) {
  const { user } = useAuth();
  const tutorials = getSortedTutorials();
  
  const accessibleTutorials = tutorials
    .filter(tutorial => {
      if (!('vipOnly' in tutorial)) return true;
      return !tutorial.vipOnly || 
        user?.role === 'admin' || 
        (user?.role === 'vip' && 'vipUsers' in tutorial && tutorial.vipUsers?.includes(user.id));
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
        {user ? (
          <button 
            onClick={onViewAll}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All
          </button>
        ) : (
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in to view more
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleTutorials.map((article) => (
          <Link
            key={article.id}
            to={`/tutorials/${article.id}`}
            className="group h-full"
            onClick={() => onSelectArticle(article)}
          >
            <div className="h-full">
              <ArticleCard article={article} onSelect={onSelectArticle} />
            </div>
          </Link>
        ))}
        
        {accessibleTutorials.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500">No tutorials available. Please sign in to view more content.</p>
          </div>
        )}
      </div>
    </div>
  );
}