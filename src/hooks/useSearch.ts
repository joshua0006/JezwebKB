import { useState, useEffect, useCallback } from 'react';
import { SearchResult, searchFirebase, SearchOptions, filterResultsByTags, sortSearchResults } from '../utils/advancedSearch';

// Hook options interface
export interface UseSearchOptions extends SearchOptions {
  debounce?: number;
  enabled?: boolean;
}

/**
 * Custom hook for searching content 
 * Provides a clean interface with loading states, caching and error handling
 */
export const useSearch = (initialQuery: string = '', options: UseSearchOptions = {}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  
  const {
    debounce = 300,
    enabled = true,
    ...searchOptions
  } = options;
  
  // Search function that can be called directly or triggered by query changes
  const search = useCallback(async (searchQuery: string, searchOpts: SearchOptions = {}) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      
      // Run the search
      const searchResults = await searchFirebase(searchQuery, {
        ...searchOptions, 
        ...searchOpts
      });
      
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
      
      setResults(searchResults);
      setLoading(false);
      return searchResults;
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred during search'));
      setLoading(false);
      return [];
    }
  }, [searchOptions]);
  
  // Run search when query changes
  useEffect(() => {
    if (!enabled || !query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      search(query);
    }, debounce);
    
    return () => clearTimeout(timer);
  }, [query, search, debounce, enabled]);
  
  // Helper functions for filtering and sorting
  const filterByTags = useCallback((tags: string[]) => {
    if (!tags || tags.length === 0) return results;
    return filterResultsByTags(results, tags);
  }, [results]);
  
  const sort = useCallback((sortBy: 'relevance' | 'date' | 'title') => {
    return sortSearchResults(results, sortBy);
  }, [results]);
  
  return {
    query,
    setQuery,
    results,
    loading,
    error,
    searchTime,
    search,
    filterByTags,
    sort,
  };
};

export default useSearch; 