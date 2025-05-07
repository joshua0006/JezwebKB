import { useState, useEffect } from 'react';
import { getAllArticles, deleteArticle } from '../services/articleService';
import { Article } from '../types/article';
import { Link } from 'react-router-dom';
import { Spinner } from './Spinner';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Plus, Tag, FileText } from 'lucide-react';

export function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { userProfile } = useAuth();
  
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesData = await getAllArticles();
        setArticles(articlesData);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile?.role === 'admin') {
      fetchArticles();
    }
  }, [userProfile]);
  
  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      setArticles(articles.filter(article => article.id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, { label: string, color: string }> = {
      'wordpress': { label: 'WordPress', color: 'bg-blue-100 text-blue-800' },
      'elementor': { label: 'Elementor', color: 'bg-purple-100 text-purple-800' },
      'gravity-forms': { label: 'Gravity Forms', color: 'bg-green-100 text-green-800' },
      'shopify': { label: 'Shopify', color: 'bg-cyan-100 text-cyan-800' },
      'general': { label: 'General', color: 'bg-gray-100 text-gray-800' }
    };
    
    return categories[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
  };
  
  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'Unknown date';
    
    try {
      // Handle various date formats
      let date;
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (dateStr.toDate && typeof dateStr.toDate === 'function') {
        // Firebase Timestamp object
        date = dateStr.toDate();
      } else if (typeof dateStr === 'string') {
        // ISO string or other date string
        date = new Date(dateStr);
      } else if (typeof dateStr === 'number') {
        // Unix timestamp
        date = new Date(dateStr);
      } else {
        return 'Invalid date';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Article Management</h2>
        <Link 
          to="/admin/articles/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Article
        </Link>
      </div>
      
      {articles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No articles found</p>
          <p className="text-sm text-gray-400 mt-1">Start by creating your first article</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map(article => {
                const category = getCategoryLabel(article.category);
                const date = formatDate(article.createdAt);
                
                return (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{article.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`${category.color} px-2 py-1 rounded-full text-xs`}>
                        {category.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        article.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{date}</td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <Link 
                        to={`/admin/articles/${article.id}/edit`} 
                        className="text-indigo-600 hover:text-indigo-800 p-1 inline-flex items-center"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {deleteConfirmId === article.id ? (
                        <div className="inline-flex items-center">
                          <button 
                            onClick={() => handleDelete(article.id)}
                            className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded mr-1"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirmId(article.id)}
                          className="text-red-600 hover:text-red-800 p-1 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 