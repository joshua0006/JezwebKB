import React, { useState } from 'react';
import { PlayCircle, Clock, Image } from 'lucide-react';
import { Article as ArticleType } from '../types/article';
import { Article as IndexArticleType } from '../types';

// Union type to handle both article types
type ArticleUnion = ArticleType | IndexArticleType;

interface ArticleCardProps {
  article: ArticleUnion;
  onSelect?: (article: ArticleUnion) => void;
}

export function ArticleCard({ article, onSelect }: ArticleCardProps) {
  const [mediaError, setMediaError] = useState(false);
  const fallbackImage = '/images/jezweb.webp';
  
  const handleMediaError = () => {
    setMediaError(true);
  };

  // Check if the article is from the article.ts type
  const isArticleType = (article: ArticleUnion): article is ArticleType => {
    return 'headerMedia' in article;
  };
  
  // Safely get article description
  const getDescription = () => {
    // First try to get the description directly (index.ts Article type)
    if ('description' in article && article.description) {
      return article.description;
    }
    
    // If no description, try to extract from content (article.ts Article type)
    if ('content' in article && article.content) {
      return article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
    }
    
    // Fallback
    return 'No description available';
  };

  // Determine the media to display
  const getMediaContent = () => {
    // If article is from article.ts and has headerMedia
    if (isArticleType(article) && article.headerMedia && !mediaError) {
      if (article.headerMedia.type === 'image') {
        return (
          <img
            src={article.headerMedia.url}
            alt={article.title}
            onError={handleMediaError}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        );
      } else if (article.headerMedia.type === 'video') {
        return (
          <div className="relative w-full h-full">
            <video
              src={article.headerMedia.url}
              className="w-full h-full object-cover"
              onError={handleMediaError}
              title={article.title}
              muted
              playsInline
              preload="metadata"
            />
          </div>
        );
      }
    }
    
    // Check for videoUrl (index.ts Article type)
    if ('videoUrl' in article && article.videoUrl && !mediaError) {
      return (
        <div className="relative w-full h-full">
          <video
            src={article.videoUrl}
            className="w-full h-full object-cover"
            onError={handleMediaError}
            title={article.title}
            muted
            playsInline
            preload="metadata"
          />
        </div>
      );
    }
    
    // Fallback to article.image if headerMedia is not available or had an error
    if (article.image && !mediaError) {
      return (
        <img
          src={article.image}
          alt={article.title}
          onError={handleMediaError}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      );
    }
    
    // Default fallback
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <img
          src={fallbackImage}
          alt="Fallback"
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Check if the article has video content
  const hasVideo = () => {
    return (isArticleType(article) && article.headerMedia?.type === 'video') || 
           ('videoUrl' in article && !!article.videoUrl);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      <div className="aspect-[2/1] overflow-hidden">
        {getMediaContent()}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            {article.category}
          </span>
          {hasVideo() && (
            <span className="flex items-center text-sm text-gray-500">
              <PlayCircle className="h-4 w-4 mr-1" />
              Video
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
        <p className="text-gray-600 mb-4 flex-1 line-clamp-3 tracking-wide">
          {getDescription()}
        </p>
        
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