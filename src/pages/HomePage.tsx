import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryList } from '../components/CategoryList';
import { FeaturedArticles } from '../components/FeaturedArticles';
import { ArticleView } from '../components/ArticleView';
import { Article, Category } from '../types';

export function HomePage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAllArticles, setShowAllArticles] = useState(false);

  return (
    <div className="">
      {selectedArticle ? (
        <ArticleView
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      ) : (
        <>
          <div>
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Jezweb Knowledge Base
              </h1>
            </Link>
            <p className="text-xl text-gray-600">
              Find guides, tutorials, and help for managing your website effectively.
            </p>
          </div>
          <CategoryList onSelectCategory={setSelectedCategory} />
          <FeaturedArticles 
            onSelectArticle={setSelectedArticle}
            onViewAll={() => setShowAllArticles(true)}
          />
        </>
      )}
    </div>
  );
} 