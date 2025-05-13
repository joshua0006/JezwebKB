import { useState, useEffect, useMemo } from 'react';
import { getAllArticles, deleteArticle, addCategory, getAllCategories, deleteCategory, seedInitialCategories } from '../services/articleService';
import { Article } from '../types/article';
import { Link } from 'react-router-dom';
import { Spinner } from './Spinner';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Plus, Tag, FileText, AlertTriangle, Search, Filter, Calendar, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, 
  // Add more icons here for selection
  BookOpen, Code, Coffee, Database, FileQuestion, Globe, Heart, Home, Image, Mail, MessageSquare, Music, 
  Package, Settings, ShoppingCart, Star, User, Video, Zap } from 'lucide-react';

// Map of available icons for categories
const availableIcons = {
  tag: Tag,
  edit: Edit,
  book: BookOpen,
  code: Code,
  coffee: Coffee,
  database: Database,
  file: FileQuestion,
  globe: Globe,
  heart: Heart,
  home: Home,
  image: Image,
  mail: Mail,
  message: MessageSquare,
  music: Music,
  package: Package,
  settings: Settings,
  cart: ShoppingCart,
  star: Star,
  user: User,
  video: Video,
  zap: Zap
};

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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Category management states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string, docId: string, icon?: string}[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string, docId: string, icon?: string} | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  
  // Add state for icon selection
  const [selectedIcon, setSelectedIcon] = useState<string>('tag');
  const [showIconSelector, setShowIconSelector] = useState(false);
  
  // Add states for seeding categories
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  
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
    
    const fetchCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    if (userProfile?.role === 'admin') {
      fetchArticles();
      fetchCategories();
    }
  }, [userProfile]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedStatus, dateRange]);
  
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
    // First check if the category exists in our loaded categories
    const foundCategory = categories.find(c => c.id === category);
    if (foundCategory) {
      return { 
        label: foundCategory.name, 
        color: getCategoryColor(category),
        icon: foundCategory.icon || 'tag'
      };
    }
    
    // Fallback to hardcoded categories
    const defaultCategories: Record<string, { label: string, color: string, icon: string }> = {
      'wordpress': { label: 'WordPress', color: 'bg-blue-100 text-blue-800', icon: 'globe' },
      'elementor': { label: 'Elementor', color: 'bg-purple-100 text-purple-800', icon: 'settings' },
      'gravity-forms': { label: 'Gravity Forms', color: 'bg-green-100 text-green-800', icon: 'file' },
      'shopify': { label: 'Shopify', color: 'bg-cyan-100 text-cyan-800', icon: 'cart' },
      'general': { label: 'General', color: 'bg-gray-100 text-gray-800', icon: 'tag' }
    };
    
    return defaultCategories[category] || { label: category, color: 'bg-gray-100 text-gray-800', icon: 'tag' };
  };
  
  // Helper function to get a consistent color for a category
  const getCategoryColor = (categoryId: string) => {
    // Define a set of colors to use
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-cyan-100 text-cyan-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
    ];
    
    // Use the category ID to deterministically select a color
    const index = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
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
    // Use the categories from the database if available
    if (categories.length > 0) {
      return categories;
    }
    
    // Fallback to extracting from articles if categories haven't loaded yet
    const categorySet = new Set<string>();
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category);
      }
    });
    return Array.from(categorySet).map(id => ({ id, name: getCategoryLabel(id).label }));
  }, [articles, categories]);

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
        (article.content && article.content.toLowerCase().includes(searchTerm.toLowerCase()));
      
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

  // Calculate pagination
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredArticles.slice(startIndex, endIndex);
  }, [filteredArticles, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredArticles.length / itemsPerPage);
  }, [filteredArticles, itemsPerPage]);

  // Page navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

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

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    
    setIsAddingCategory(true);
    setCategoryError('');
    
    try {
      // Include the selected icon when adding a new category
      const newCategory = await addCategory(newCategoryName, selectedIcon);
      // Ensure we have a docId property (it will be added when fetching from Firebase next time)
      setCategories([...categories, { ...newCategory, docId: 'temp-' + Date.now(), icon: selectedIcon }]);
      setNewCategoryName('');
      setSelectedIcon('tag'); // Reset to default icon
      setCategoryModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setCategoryError(error.message);
      } else {
        setCategoryError('Failed to add category');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const openCategoryModal = () => {
    setNewCategoryName('');
    setSelectedIcon('tag'); // Reset to default icon
    setCategoryError('');
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setCategoryError('');
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsDeletingCategory(true);
    
    try {
      await deleteCategory(categoryToDelete.docId);
      setCategories(categories.filter(cat => cat.docId !== categoryToDelete.docId));
      closeDeleteCategoryModal();
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error instanceof Error) {
        setCategoryError(error.message);
      } else {
        setCategoryError('Failed to delete category');
      }
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const confirmDeleteCategory = (category: {id: string, name: string, docId: string, icon?: string}) => {
    setCategoryToDelete(category);
    setDeleteCategoryModalOpen(true);
  };

  const closeDeleteCategoryModal = () => {
    setDeleteCategoryModalOpen(false);
    setCategoryToDelete(null);
    setCategoryError('');
  };
  
  // Add a function to handle seeding initial categories
  const handleSeedCategories = async () => {
    setIsSeedingCategories(true);
    setSeedMessage('');
    
    try {
      const result = await seedInitialCategories();
      setSeedMessage(result.message);
      
      // Refresh the categories list
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error seeding categories:', error);
      if (error instanceof Error) {
        setSeedMessage(`Error: ${error.message}`);
      } else {
        setSeedMessage('Failed to seed categories');
      }
    } finally {
      setIsSeedingCategories(false);
    }
  };
  
  // Function to render the selected icon
  const renderCategoryIcon = (iconName: string) => {
    const IconComponent = availableIcons[iconName as keyof typeof availableIcons] || Tag;
    return <IconComponent className="w-4 h-4" />;
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
        <div className="flex gap-3">
          <Link 
            to="/admin/articles/create"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </Link>
          <button
            onClick={openCategoryModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Tag className="w-4 h-4" />
            Add Category
          </button>
        </div>
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
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {availableCategories.map(category => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategoryFilter(category.id)}
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-600">
                      {category.name}
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
              {paginatedArticles.map(article => {
                const category = getCategoryLabel(article.category);
                const date = formatDate(article.createdAt);
                const IconComponent = availableIcons[category.icon as keyof typeof availableIcons] || Tag;
                
                return (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{article.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`${category.color} px-2 py-1 rounded-full text-xs flex items-center gap-1`}>
                        <IconComponent className="w-3 h-3" />
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
                        to={`/admin/articles/${article.id}/edit-new`} 
                        className="text-purple-600 hover:text-purple-800 p-1 inline-flex items-center"
                        title="Edit article"
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
          
          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <span>Showing</span>
              <select 
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>of {filteredArticles.length} articles</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                {/* Current page indicator */}
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                  {currentPage}
                </span>
                <span className="px-1 text-gray-500">of</span>
                <span className="px-3 py-1 text-gray-700">
                  {totalPages || 1}
                </span>
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
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

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4 text-indigo-600">
              <Tag className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Category Management</h3>
            </div>
            
            <div className="mb-6">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                Add New Category
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  id="categoryName"
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                  disabled={isAddingCategory || !newCategoryName.trim()}
                >
                  {isAddingCategory ? (
                    <>
                      <Spinner className="w-4 h-4 text-white" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
              </div>
              
              {/* Icon selector */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconSelector(!showIconSelector)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <div className="flex items-center gap-2">
                      {renderCategoryIcon(selectedIcon)}
                      <span className="text-sm">{selectedIcon}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showIconSelector && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-4 gap-2 p-2">
                        {Object.keys(availableIcons).map(iconName => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(iconName);
                              setShowIconSelector(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-100 ${
                              selectedIcon === iconName ? 'bg-indigo-50 border border-indigo-200' : ''
                            }`}
                          >
                            {renderCategoryIcon(iconName)}
                            <span className="text-xs mt-1">{iconName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {categoryError && (
                <p className="mt-1 text-sm text-red-600">{categoryError}</p>
              )}
            </div>
            
            {/* Existing Categories List */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Existing Categories</h4>
               
              </div>
              
              {seedMessage && (
                <p className={`text-sm mb-2 p-1 rounded ${seedMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedMessage}
                </p>
              )}
              
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No categories found</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map(category => (
                        <tr key={category.docId}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div className="flex items-center justify-center">
                              {renderCategoryIcon(category.icon || 'tag')}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{category.name}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => confirmDeleteCategory(category)}
                              className="text-red-600 hover:text-red-800 p-1 inline-flex items-center"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeCategoryModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategoryModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Delete Category</h3>
            </div>
            <p className="mb-4">
              Are you sure you want to delete the category "{categoryToDelete.name}"? This action cannot be undone.
            </p>
            <p className="mb-4 text-sm bg-yellow-50 p-3 rounded-md text-yellow-800 border border-yellow-200">
              <strong>Warning:</strong> Deleting this category will not affect existing articles that use it, but they may display with an unknown category.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDeleteCategoryModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeletingCategory}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeletingCategory}
              >
                {isDeletingCategory ? (
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