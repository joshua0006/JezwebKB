import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSelect?: (article: Article) => void;  // Make onSelect optional since FeaturedArticles doesn't use it
}

export function ArticleCard({ article, onSelect }: ArticleCardProps) {
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      <div className="aspect-[2/1] overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            {article.category}
          </span>
          {article.videoUrl && (
            <span className="flex items-center text-sm text-gray-500">
              <PlayCircle className="h-4 w-4 mr-1" />
              Video tutorial
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
        <p className="text-gray-600 mb-4 flex-1 line-clamp-2">{article.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Updated {new Date(article.updatedAt).toLocaleDateString()}
          </div>
          {onSelect && (
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onSelect(article);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Read More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}