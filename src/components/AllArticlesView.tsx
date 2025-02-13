import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { getSortedTutorials } from '../data/tutorials';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { SEO } from './SEO';

interface AllArticlesViewProps {
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
}

export function AllArticlesView({ onBack, onSelectArticle }: AllArticlesViewProps) {
  const { user } = useAuth();
  const tutorials = getSortedTutorials();
  
  const accessibleTutorials = tutorials.filter(tutorial => 
    !tutorial.vipOnly || 
    user?.role === 'admin' || 
    (user?.role === 'vip' && tutorial.vipUsers?.includes(user.id))
  );

  const handleSelectArticle = (article: Article) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onSelectArticle(article);
  };

  return (
    <div className="space-y-8">
      <SEO 
        title="All Tutorials"
        description={`Browse our complete collection of ${accessibleTutorials.length} web development tutorials and guides. Learn WordPress, Elementor, and more.`}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Articles</h1>
        <p className="text-xl text-gray-600">
          Browse our complete collection of {accessibleTutorials.length} tutorials and guides.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleTutorials.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSelect={handleSelectArticle}
          />
        ))}
      </div>

      {/* Empty State */}
      {accessibleTutorials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {user ? 'No articles available.' : 'Please sign in to view our articles.'}
          </p>
        </div>
      )}
    </div>
  );
}