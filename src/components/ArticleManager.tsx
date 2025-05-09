import { useState, useEffect, useMemo } from 'react';
import { getAllArticles, deleteArticle } from '../services/articleService';
import { Article } from '../types/article';
import { Link } from 'react-router-dom';
import { Spinner } from './Spinner';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Plus, Tag, FileText, AlertTriangle, Search, Filter, Calendar, X, ChevronDown } from 'lucide-react';

export function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { userProfile } = useAuth();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
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
    setIsDeleting(true);
    try {
      await deleteArticle(id);
      setArticles(articles.filter(article => article.id !== id));
      closeModal();
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (article: Article) => {
    setArticleToDelete(article);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setArticleToDelete(null);
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

  // Get unique categories from articles
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    articles.forEach(article => {
      if (article.category) {
        categories.add(article.category);
      }
    });
    return Array.from(categories);
  }, [articles]);

  // Get unique authors (createdBy)
  const availableAuthors = useMemo(() => {
    const authors = new Set<string>();
    articles.forEach(article => {
      if (article.createdBy) {
        authors.add(article.createdBy);
      }
    });
    return Array.from(authors);
  }, [articles]);

  // Filter articles based on search term and filters
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.content && article.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.createdBy && article.createdBy.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        (article.category && selectedCategories.includes(article.category));
      
      // Status filter
      const matchesStatus = selectedStatus.length === 0 || 
        (selectedStatus.includes('published') && article.published) ||
        (selectedStatus.includes('draft') && !article.published);
      
      // Date filter
      let matchesDate = true;
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        const articleDate = new Date(article.createdAt);
        if (articleDate < startDate) {
          matchesDate = false;
        }
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        const articleDate = new Date(article.createdAt);
        if (articleDate > endDate) {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [articles, searchTerm, selectedCategories, selectedStatus, dateRange]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatus([]);
    setDateRange({ start: '', end: '' });
  };

  const toggleCategoryFilter = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleStatusFilter = (status: string) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter(s => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
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

      {/* Search and Filter Section */}
      <div className="mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search articles by title or content"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {(selectedCategories.length > 0 || selectedStatus.length > 0 || dateRange.start || dateRange.end) && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-red-600 px-3 py-1.5 border border-red-200 rounded hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
          
          <div className="text-sm text-gray-500">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
              <div className="space-y-1">
                {availableCategories.map(category => (
                  <div key={category} className="flex items-center">
                    <input
                      id={`category-${category}`}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategoryFilter(category)}
                    />
                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-600">
                      {getCategoryLabel(category).label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    id="status-published"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedStatus.includes('published')}
                    onChange={() => toggleStatusFilter('published')}
                  />
                  <label htmlFor="status-published" className="ml-2 text-sm text-gray-600">
                    Published
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="status-draft"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedStatus.includes('draft')}
                    onChange={() => toggleStatusFilter('draft')}
                  />
                  <label htmlFor="status-draft" className="ml-2 text-sm text-gray-600">
                    Draft
                  </label>
                </div>
              </div>
            </div>
            
            {/* Date Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
              <div className="space-y-2">
                <div>
                  <label htmlFor="date-from" className="block text-xs text-gray-500">From</label>
                  <input
                    id="date-from"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="date-to" className="block text-xs text-gray-500">To</label>
                  <input
                    id="date-to"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {filteredArticles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No articles found</p>
          <p className="text-sm text-gray-400 mt-1">
            {articles.length > 0 
              ? 'Try adjusting your search filters'
              : 'Start by creating your first article'
            }
          </p>
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
              {filteredArticles.map(article => {
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
                      <button 
                        onClick={() => confirmDelete(article)}
                        className="text-red-600 hover:text-red-800 p-1 inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalOpen && articleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Delete Article</h3>
            </div>
            <p className="mb-4">
              Are you sure you want to delete "{articleToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(articleToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 