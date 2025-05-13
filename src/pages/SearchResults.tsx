import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SearchResult, clearSearchCache, sortSearchResults } from '../utils/advancedSearch';
import { useSearch } from '../hooks/useSearch';
import { Category } from '../types';
import { ChevronLeft, ChevronRight, Filter, Search as SearchIcon, Clock, Tag, Menu, X, Sliders, RefreshCw } from 'lucide-react';
import { getAllCategories } from '../services/articleService';

// Simple PageHeader component defined inline since the import was missing
const PageHeader = ({ title }: { title: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
  </div>
);

export function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Get search parameters from URL
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const tagsParam = searchParams.get('tags') || '';
  const sortByParam = (searchParams.get('sortBy') || 'relevance') as 'relevance' | 'date' | 'title';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const exactMatchParam = searchParams.get('exact') === 'true';
  
  // State variables for filtering and UI
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagsParam ? tagsParam.split(',') : []);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>(sortByParam);
  const [exactMatch, setExactMatch] = useState(exactMatchParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 768); // Default to showing filters on desktop
  
  // Use our custom search hook
  const { 
    query, 
    setQuery, 
    results: allResults, 
    loading, 
    searchTime,
    search 
  } = useSearch(queryParam, {
    sortBy,
    filterCategory: selectedCategory || undefined,
    exactMatch,
    limit: 100, // Get a good number of results for pagination
  });
  
  // Filter results by tags (not handled by the hook directly)
  const filteredResults = useMemo(() => {
    if (selectedTags.length === 0) return allResults;
    return allResults.filter(result => 
      selectedTags.some(tag => result.item.tags.includes(tag))
    );
  }, [allResults, selectedTags]);
  
  // Get available tags from results
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    filteredResults.forEach(result => {
      result.item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [filteredResults]);
  
  // Apply pagination
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredResults.slice(start, start + resultsPerPage);
  }, [filteredResults, currentPage]);
  
  // Calculate total pages
  const totalResults = filteredResults.length;
  const resultsPerPage = 10;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  
  const [categories, setCategories] = useState<{ id: Category; label: string }[]>([]);
  
  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        if (fetchedCategories.length > 0) {
          const formattedCategories = fetchedCategories.map(category => ({
            id: category.id,
            label: category.name
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default category
        setCategories([{ id: 'general', label: 'General' }]);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (sortBy !== 'relevance') params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (exactMatch) params.set('exact', 'true');
    
    navigate({ pathname: '/search', search: params.toString() }, { replace: true });
  }, [query, selectedCategory, selectedTags, sortBy, exactMatch, currentPage, navigate]);
  
  // Helper function to determine the correct URL path for an item
  const getItemUrl = (result: SearchResult): string => {
    return result.type === 'article' 
      ? `/articles/${result.item.id}` 
      : `/tutorials/${result.item.id}`;
  };
  
  // When filter parameters change, re-run the search and reset to page 1
  useEffect(() => {
    search(query, {
      sortBy,
      filterCategory: selectedCategory || undefined,
      exactMatch
    });
    setCurrentPage(1);
  }, [selectedCategory, sortBy, exactMatch, search]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };
  
  // Handle clearing the search cache and re-running the search
  const handleClearCache = () => {
    clearSearchCache();
    search(query, {
      sortBy,
      filterCategory: selectedCategory || undefined,
      exactMatch
    });
  };
  
  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(prevCategory => prevCategory === categoryId ? '' : categoryId);
  };
  
  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setCurrentPage(1);
  };
  
  // Generate pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-6 space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded ${
            currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-indigo-600 hover:bg-indigo-50'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // Show current page and 2 pages before and after
          let pageNum = currentPage;
          if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          if (pageNum <= 0 || pageNum > totalPages) return null;
          
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded ${
                currentPage === pageNum
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded ${
            currentPage === totalPages 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-indigo-600 hover:bg-indigo-50'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('relevance');
    setExactMatch(false);
    setCurrentPage(1);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Search Results" />
      
      {/* Search form */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutorials, articles, and more..."
              className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Sliders className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
        </form>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <div className="w-full md:w-64 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearCache}
                  className="text-sm flex items-center text-gray-500 hover:text-gray-700" 
                  title="Clear search cache and reload results"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </button>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all
                </button>
              </div>
            </div>
            
            {/* Sort options */}
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Sort by</h4>
              <div className="flex flex-col space-y-2">
                {(['relevance', 'date', 'title'] as const).map((option) => (
                  <label key={option} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sortBy"
                      checked={sortBy === option}
                      onChange={() => setSortBy(option)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Exact match filter */}
            <div className="mb-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={() => setExactMatch(!exactMatch)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Exact match only
                </span>
              </label>
            </div>
            
            {/* Category filter */}
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Category</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategory === category.id}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Tags filter */}
            {availableTags.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-800 font-medium'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Results area */}
        <div className={`flex-1 ${!showFilters ? 'max-w-4xl mx-auto' : ''}`}>
          {/* Applied filters */}
          {(selectedCategory || selectedTags.length > 0 || sortBy !== 'relevance' || exactMatch) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">Applied filters:</span>
              
              {selectedCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1.5 h-4 w-4 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {selectedTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1.5 h-4 w-4 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {sortBy !== 'relevance' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Sorted by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  <button
                    onClick={() => setSortBy('relevance')}
                    className="ml-1.5 h-4 w-4 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {exactMatch && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Exact match only
                  <button
                    onClick={() => setExactMatch(false)}
                    className="ml-1.5 h-4 w-4 flex items-center justify-center rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 ml-2"
              >
                Clear all
              </button>
            </div>
          )}
          
          {/* Search results count */}
          {!loading && query && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {totalResults > 0 
                  ? `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"${searchTime ? ` (${searchTime.toFixed(2)}ms)` : ''}`
                  : `No results found for "${query}"`
                }
              </p>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Results list */}
              {paginatedResults.length > 0 ? (
                <div className="space-y-6">
                  {paginatedResults.map((result) => (
                    <div 
                      key={result.item.id} 
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <Link
                        to={getItemUrl(result)}
                        className="block"
                      >
                        <h3 className="text-lg font-medium text-indigo-600 mb-2 hover:underline">
                          {result.item.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {result.item.description || (result.item.blocks && result.item.blocks[0]?.content)}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Menu className="w-3 h-3" />
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </span>
                          
                          {result.item.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {result.item.category}
                            </span>
                          )}
                          
                          {result.item.updatedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(result.item.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {result.item.tags && result.item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                query.length >= 2 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 mb-4">No results found for your search.</p>
                    <p className="text-sm text-gray-400">Try different keywords or filters.</p>
                  </div>
                )
              )}
              
              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 