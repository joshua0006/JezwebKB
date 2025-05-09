import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchResult, searchFirebase, filterResultsByTags, SearchOptions, getSuggestedSearchTerms, clearSearchCache } from '../utils/advancedSearch';
import { Category } from '../types';
import { ChevronDown, Filter, X, Search as SearchIcon, Clock, Tag, Menu, ExternalLink, RefreshCw } from 'lucide-react';

interface SearchProps {
  className?: string;
  placeholder?: string;
}

export function EnhancedSearch({ className = '', placeholder = 'Search tutorials, articles, and more...' }: SearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [exactMatch, setExactMatch] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories: { id: Category; label: string }[] = [
    { id: 'wordpress', label: 'WordPress' },
    { id: 'elementor', label: 'Elementor' },
    { id: 'gravity-forms', label: 'Gravity Forms' },
    { id: 'shopify', label: 'Shopify' },
    { id: 'general', label: 'General' }
  ];

  // Extract all unique tags from search results
  useEffect(() => {
    if (results.length > 0) {
      const tags = new Set<string>();
      results.forEach(result => {
        result.item.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    }
  }, [results]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load search suggestions when query changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (query && query.length >= 2) {
        try {
          const suggestedTerms = await getSuggestedSearchTerms(query);
          setSuggestions(suggestedTerms);
        } catch (error) {
          console.error('Error loading suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    };
    
    loadSuggestions();
  }, [query]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query && query.length >= 2) {
        setLoading(true);
        try {
          const searchOptions: SearchOptions = {
            sortBy,
            filterCategory: selectedCategory || undefined,
            limit: 5, // Limit quick search results to 5 items
            exactMatch
          };
          
          const searchResults = await searchFirebase(query, searchOptions);
          const filteredResults = selectedTags.length > 0 
            ? filterResultsByTags(searchResults, selectedTags)
            : searchResults;
            
          setResults(filteredResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [query, sortBy, selectedCategory, selectedTags, exactMatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  // Helper function to determine the correct URL path for an item
  const getItemUrl = (result: SearchResult): string => {
    return result.type === 'article' 
      ? `/articles/${result.item.id}` 
      : `/tutorials/${result.item.id}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      // If dropdown not open and Enter pressed, redirect to search page
      if (e.key === 'Enter' && query.trim().length >= 2) {
        e.preventDefault();
        handleAdvancedSearch();
      }
      return;
    }

    // Count total selectable items (results + suggestions + "View all")
    const totalItems = results.length + suggestions.length + 1;

    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    }
    // Enter
    else if (e.key === 'Enter') {
      e.preventDefault();
      
      // If a result is selected, navigate to it
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const selected = results[selectedIndex];
        if (selected) {
          setQuery('');
          setIsOpen(false);
          navigate(getItemUrl(selected));
        }
      } 
      // If a suggestion is selected, set it as the query
      else if (selectedIndex >= results.length && selectedIndex < results.length + suggestions.length) {
        const suggestionIndex = selectedIndex - results.length;
        const selected = suggestions[suggestionIndex];
        setQuery(selected);
        // Don't close dropdown, let the search run with the new query
      }
      // If we're at the "View all results" option, go to search page
      else if (selectedIndex === totalItems - 1) {
        handleAdvancedSearch();
      }
      // If nothing is selected, go to search page as well
      else if (query.trim().length >= 2) {
        handleAdvancedSearch();
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowFilters(false);
      inputRef.current?.blur();
    }
  };

  const handleAdvancedSearch = () => {
    // Redirect to search page with params
    const params = new URLSearchParams();
    params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (sortBy !== 'relevance') params.set('sortBy', sortBy);
    if (exactMatch) params.set('exact', 'true');
    
    navigate({
      pathname: '/search',
      search: params.toString()
    });
    
    setIsOpen(false);
    setQuery('');
  };

  const handleClearCache = () => {
    clearSearchCache();
    // If there's an active search, re-run it
    if (query.length >= 2) {
      setLoading(true);
      setTimeout(() => {
        // Force a re-search by setting query to itself
        const currentQuery = query;
        setQuery('');
        setTimeout(() => setQuery(currentQuery), 10);
      }, 100);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSortBy('relevance');
    setExactMatch(false);
  };

  // Display human-readable result count and timing
  const resultStats = useMemo(() => {
    if (results.length === 0) return '';
    return `${results.length} result${results.length === 1 ? '' : 's'}`;
  }, [results]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => query && query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-300"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="ml-1 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Show filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Search Filters</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCache}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                title="Clear search cache"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset cache
              </button>
              <button 
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            </div>
          </div>
          
          {/* Sort options */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
            <div className="flex flex-wrap gap-2">
              {(['relevance', 'date', 'title'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    sortBy === option
                      ? 'bg-indigo-100 text-indigo-800 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Exact match option */}
          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exactMatch}
                onChange={() => setExactMatch(!exactMatch)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="ml-2 text-xs text-gray-700">
                Exact match only
              </span>
            </label>
          </div>
          
          {/* Category filter */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(prev => prev === category.id ? null : category.id)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    selectedCategory === category.id
                      ? 'bg-indigo-100 text-indigo-800 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tags filter - only show if we have tags from results */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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
      
      {/* Search Results */}
      {isOpen && (
        <div className="absolute z-40 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : results.length > 0 || suggestions.length > 0 ? (
            <>
              {results.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    {resultStats}
                  </div>
                  
                  {results.map((result, index) => (
                    <Link
                      key={result.item.id}
                      to={getItemUrl(result)}
                      className={`block px-4 py-3 hover:bg-gray-50 ${
                        index === selectedIndex ? 'bg-gray-100' : ''
                      } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
                      onClick={() => {
                        setQuery('');
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 mb-1">
                          {result.item.title}
                        </span>
                        
                        <span className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {result.item.description || (result.item.blocks && result.item.blocks[0]?.content)}
                        </span>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Menu className="w-3 h-3" />
                            {result.type}
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
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {result.item.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                +{result.item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </>
              )}
              
              {/* Suggested search terms */}
              {suggestions.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    Suggestions
                  </div>
                  
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        index + results.length === selectedIndex ? 'bg-gray-100' : ''
                      } ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                      onClick={() => {
                        setQuery(suggestion);
                      }}
                    >
                      <div className="flex items-center">
                        <SearchIcon className="h-3 w-3 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
              
              {/* View all results link */}
              <button
                onClick={handleAdvancedSearch}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 ${
                  selectedIndex === results.length + suggestions.length ? 'bg-indigo-50' : ''
                }`}
              >
                <span>View all search results</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <p>No results found for "{query}"</p>
              <button
                onClick={handleAdvancedSearch}
                className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto"
              >
                <span>Advanced search</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 