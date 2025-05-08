import React, { useState } from 'react';
import { Clock, ArrowLeft, Tag, Crown, BookOpen, Share2, Heart } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { iconMap } from '../data/icons';
import { SEO } from './SEO';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
}

export function ArticleView({ article, onBack }: ArticleViewProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fallbackImage = '/images/jezweb.webp';

  const canAccessTutorial = !article.vipOnly || 
    user?.role === 'admin' || 
    (user?.role === 'vip' && article.vipUsers?.includes(user.id));

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const handleImageError = (blockId: string) => {
    setImageErrors(prev => ({ ...prev, [blockId]: true }));
  };

  if (!canAccessTutorial) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </button>

        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">VIP Access Required</h2>
          <p className="text-gray-600 mb-6">
            This tutorial is only available to specific VIP users.
          </p>
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Upgrade to VIP
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <SEO 
        title={article.title}
        description={article.description}
        type="article"
      />
      {/* Navigation and Actions */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              isBookmarked ? 'text-indigo-600' : 'text-gray-500'
            }`}
            title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            <Heart className="h-5 w-5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            title="Share article"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            {article.category}
          </span>
          {article.vipOnly && (
            <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center">
              <Crown className="h-3 w-3 mr-1" />
              VIP Only
            </span>
          )}
          <span className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(article.updatedAt).toLocaleDateString()}
            <span className="mx-2">•</span>
            <BookOpen className="h-4 w-4 mr-1" />
            {article.blocks.length} sections
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
        <p className="text-xl text-gray-600">{article.description}</p>
      </div>

      {/* Video Section */}
      {article.videoUrl && (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 max-w-[960px]">Video Tutorial</h2>
          <div className="relative pb-[56.25%] h-0">
            <iframe
              src={article.videoUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg max-w-[960px]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content Blocks */}
      <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
        {article.blocks.map((block) => {
          switch (block.type) {
            case 'heading':
              return (
                <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }} 
                  className="prose prose-indigo max-w-none" />
              );
            case 'text':
              return (
                <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }}
                  className="prose prose-indigo max-w-none text-gray-700" />
              );
            case 'button':
              const buttonData = JSON.parse(block.content);
              return (
                <div key={block.id} className="flex justify-center py-4">
                  <a
                    href={buttonData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      buttonData.variant === 'primary'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : buttonData.variant === 'secondary'
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : buttonData.variant === 'outline'
                        ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {buttonData.text}
                  </a>
                </div>
              );
            case 'divider':
              const dividerData = JSON.parse(block.content);
              return (
                <div key={block.id} className="py-4">
                  <hr
                    className={`
                      ${dividerData.width === 'full' ? 'w-full' : dividerData.width === '3/4' ? 'w-3/4' : 'w-1/2'}
                      mx-auto
                      ${dividerData.style === 'solid' ? 'border-solid' : dividerData.style === 'dashed' ? 'border-dashed' : 'border-dotted'}
                      ${
                        dividerData.color === 'gray'
                          ? 'border-gray-300'
                          : dividerData.color === 'indigo'
                          ? 'border-indigo-500'
                          : dividerData.color === 'red'
                          ? 'border-red-500'
                          : 'border-green-500'
                      }
                    `}
                  />
                </div>
              );
            case 'spacer':
              const spacerData = JSON.parse(block.content);
              const spacerHeight = 
                spacerData.height === 'small' ? 'h-4' :
                spacerData.height === 'medium' ? 'h-8' :
                spacerData.height === 'large' ? 'h-16' : 'h-24';
              return (
                <div key={block.id} className={spacerHeight} />
              );
            case 'icon':
              const iconData = JSON.parse(block.content);
              const IconComponent = iconMap[iconData.icon as keyof typeof iconMap];
              if (!IconComponent) return null;
              const iconSize = 
                iconData.size === 'small' ? 'h-4 w-4' :
                iconData.size === 'medium' ? 'h-6 w-6' :
                iconData.size === 'large' ? 'h-8 w-8' : 'h-12 w-12';
              const iconColor =
                iconData.color === 'gray' ? 'text-gray-600' :
                iconData.color === 'indigo' ? 'text-indigo-600' :
                iconData.color === 'red' ? 'text-red-600' : 'text-green-600';
              return (
                <div key={block.id} className="flex justify-center py-4">
                  <IconComponent className={`${iconSize} ${iconColor}`} />
                </div>
              );
            case 'image':
              return (
                <div key={block.id} className="rounded-lg overflow-hidden">
                  <img 
                    src={imageErrors[block.id] ? fallbackImage : block.content} 
                    alt="" 
                    className="w-full h-auto" 
                    onError={() => handleImageError(block.id)}
                  />
                </div>
              );
            case 'video':
              return (
                <div key={block.id} className="relative pb-[56.25%] h-0">
                  <iframe
                    src={block.content}
                    className="absolute top-0 left-0 w-full h-full rounded-lg max-w-[960px]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Tags Section */}
      {article.tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Topics</h3>
          <div className="flex items-center flex-wrap gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                onClick={() => {
                  onBack();
                  window.dispatchEvent(new CustomEvent('selectTag', { detail: tag }));
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}