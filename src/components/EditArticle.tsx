import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleCreator } from './ArticleCreator';
import { getArticleById } from '../services/articleService';
import { Spinner } from './Spinner';

/**
 * EditArticle component that wraps ArticleCreator
 * Gets the article ID from the URL parameters and passes it to ArticleCreator
 */
export const EditArticle: React.FC = () => {
  // Get article ID from URL params
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkArticle = async () => {
      if (!id) {
        setError('Article ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        // Verify article exists before attempting to edit it
        const article = await getArticleById(id);
        if (article) {
          setExists(true);
        }
      } catch (err) {
        console.error('Error checking article:', err);
        setError('Article not found or you do not have permission to edit it');
      } finally {
        setLoading(false);
      }
    };
    
    checkArticle();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner className="w-8 h-8 text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading article...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">{error}</p>
        <button 
          onClick={() => navigate('/admin/articles')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Articles
        </button>
      </div>
    );
  }
  
  if (!id || !exists) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="font-medium">Article not found.</p>
        <button 
          onClick={() => navigate('/admin/articles')}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Back to Articles
        </button>
      </div>
    );
  }
  
  return <ArticleCreator articleId={id} />;
}; 