import { collection, query as fbQuery, where, getDocs, orderBy, limit as fbLimit, startAfter, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Article, Tutorial } from '../types';

// Interface for search results with relevance score
export interface SearchResult {
  item: Article | Tutorial;
  score: number;
  type: 'article' | 'tutorial';
}

// Interface for search options
export interface SearchOptions {
  includeContent?: boolean;
  includeTitle?: boolean;
  includeTags?: boolean;
  includeCategory?: boolean;
  sortBy?: 'relevance' | 'date' | 'title';
  limit?: number;
  filterCategory?: string;
  filterTags?: string[];
  publishedOnly?: boolean;
  exactMatch?: boolean;
}

// Default search options
const defaultOptions: SearchOptions = {
  includeContent: true,
  includeTitle: true,
  includeTags: true,
  includeCategory: true,
  sortBy: 'relevance',
  limit: 20,
  publishedOnly: true,
  exactMatch: false,
};

// Create a simple cache mechanism
interface CacheEntry {
  timestamp: number;
  results: SearchResult[];
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Generate cache key based on search parameters
const generateCacheKey = (query: string, options: SearchOptions): string => {
  return `${query}|${JSON.stringify(options)}`;
};

/**
 * Calculate relevance score for an item based on the query
 */
const calculateRelevanceScore = (
  item: Article | Tutorial, 
  query: string, 
  options: SearchOptions
): number => {
  const lowerCaseQuery = query.toLowerCase();
  const queryTerms = lowerCaseQuery.split(/\s+/).filter(term => term.length > 2);
  
  let score = 0;
  
  // Title matches (highest weight)
  if (options.includeTitle && item.title) {
    const titleLower = item.title.toLowerCase();
    
    // Exact title match gets highest score
    if (titleLower === lowerCaseQuery) {
      score += 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(lowerCaseQuery)) {
      score += 75;
    }
    // Title contains query
    else if (titleLower.includes(lowerCaseQuery)) {
      score += 50;
    }
    
    // Check individual terms in title
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 20;
      }
    });
  }
  
  // Tag matches (high weight)
  if (options.includeTags && item.tags && item.tags.length) {
    const matchingTags = item.tags.filter(tag => 
      tag.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Add score based on number of matching tags
    score += matchingTags.length * 30;
    
    // Check individual terms in tags
    queryTerms.forEach(term => {
      const tagsWithTerm = item.tags.filter(tag => 
        tag.toLowerCase().includes(term)
      );
      score += tagsWithTerm.length * 10;
    });
  }
  
  // Category matches (medium weight)
  if (options.includeCategory && item.category) {
    const categoryLower = item.category.toLowerCase();
    if (categoryLower.includes(lowerCaseQuery)) {
      score += 25;
    }
    
    // Check individual terms in category
    queryTerms.forEach(term => {
      if (categoryLower.includes(term)) {
        score += 8;
      }
    });
  }
  
  // Content matches (lower weight but still significant)
  if (options.includeContent && item.blocks) {
    let contentMatchCount = 0;
    
    // Check content blocks
    item.blocks.forEach(block => {
      if (block.content && typeof block.content === 'string') {
        const contentLower = block.content.toLowerCase();
        
        // Exact phrase match in content
        if (contentLower.includes(lowerCaseQuery)) {
          contentMatchCount += 2;
        }
        
        // Individual terms in content
        queryTerms.forEach(term => {
          // Count occurrences of the term
          const regex = new RegExp(term, 'gi');
          const matches = contentLower.match(regex);
          if (matches) {
            contentMatchCount += matches.length;
          }
        });
      }
    });
    
    // Add score based on content matches
    score += Math.min(contentMatchCount * 5, 40); // Cap content score
  }
  
  // Bonus for recently updated content
  if (item.updatedAt) {
    const updateDate = new Date(item.updatedAt);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Bonus points for recently updated content (up to 30 days)
    if (daysSinceUpdate < 30) {
      score += Math.max(0, 10 - Math.floor(daysSinceUpdate / 3));
    }
  }
  
  return score;
};

/**
 * Check if an item should be published based on its properties
 */
const isPublished = (item: any): boolean => {
  // Check different published status formats that might be in the database
  if (item.status === 'published') return true;
  if (item.published === true) return true;
  
  // VIP content is considered published
  if (item.vipOnly === true) return true;
  
  // Default to checking if explicitly set to not published
  return item.status !== 'draft' && item.published !== false;
};

/**
 * Determine if a search result is an article or tutorial
 */
const determineItemType = (item: Article | Tutorial): 'article' | 'tutorial' => {
  // First check by ID pattern
  if (item.id && typeof item.id === 'string') {
    if (item.id.includes('article')) return 'article';
    if (item.id.includes('tutorial')) return 'tutorial';
  }
  
  // Then check for tutorial specific properties
  if ('blocks' in item && Array.isArray(item.blocks)) {
    return 'tutorial';
  }
  
  // Default to article (could be improved with more checks)
  return 'article';
};

/**
 * Search articles and tutorials in Firebase
 */
export const searchFirebase = async (
  searchQuery: string, 
  options: SearchOptions = defaultOptions
): Promise<SearchResult[]> => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }
  
  const queryText = searchQuery.toLowerCase().trim();
  const mergedOptions = { ...defaultOptions, ...options };
  const cacheKey = generateCacheKey(queryText, mergedOptions);
  
  // Check cache first
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`Using cached search results for "${searchQuery}"`);
    return cachedResult.results;
  }
  
  try {
    // Create array to hold all search results
    const results: SearchResult[] = [];
    
    // Articles collection query
    const articlesRef = collection(db, 'articles');
    
    // Add basic filtering on Firebase side if possible
    let articlesQuery = fbQuery(articlesRef);
    if (mergedOptions.filterCategory) {
      articlesQuery = fbQuery(articlesRef, where('category', '==', mergedOptions.filterCategory));
    }
    
    // Get articles
    const articlesSnapshot = await getDocs(articlesQuery);
    
    // Process article results
    articlesSnapshot.forEach((doc) => {
      const article = { id: doc.id, ...doc.data() } as Article;
      
      // Skip if not published and publishedOnly is true
      if (mergedOptions.publishedOnly && !isPublished(article)) {
        return;
      }
      
      // Skip if exact match is required and no exact match in title/content/tags
      if (mergedOptions.exactMatch && !(
        article.title.toLowerCase().includes(queryText) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(queryText))) ||
        (article.blocks && article.blocks.some(block => 
          block.content && block.content.toLowerCase().includes(queryText)
        ))
      )) {
        return;
      }
      
      const score = calculateRelevanceScore(article, queryText, mergedOptions);
      
      // Only include results that have a minimum score
      if (score > 10) {
        results.push({ 
          item: article, 
          score,
          type: 'article'
        });
      }
    });
    
    // Tutorials collection query
    const tutorialsRef = collection(db, 'tutorials');
    
    // Add basic filtering on Firebase side if possible
    let tutorialsQuery = fbQuery(tutorialsRef);
    if (mergedOptions.filterCategory) {
      tutorialsQuery = fbQuery(tutorialsRef, where('category', '==', mergedOptions.filterCategory));
    }
    
    // Get tutorials
    const tutorialsSnapshot = await getDocs(tutorialsQuery);
    
    // Process tutorial results
    tutorialsSnapshot.forEach((doc) => {
      const tutorial = { id: doc.id, ...doc.data() } as Tutorial;
      
      // Skip if not published and publishedOnly is true
      if (mergedOptions.publishedOnly && !isPublished(tutorial)) {
        return;
      }
      
      // Skip if exact match is required and no exact match in title/content/tags
      if (mergedOptions.exactMatch && !(
        tutorial.title.toLowerCase().includes(queryText) ||
        (tutorial.description && tutorial.description.toLowerCase().includes(queryText)) ||
        (tutorial.tags && tutorial.tags.some(tag => tag.toLowerCase().includes(queryText))) ||
        (tutorial.blocks && tutorial.blocks.some(block => 
          block.content && block.content.toLowerCase().includes(queryText)
        ))
      )) {
        return;
      }
      
      const score = calculateRelevanceScore(tutorial, queryText, mergedOptions);
      
      // Only include results that have a minimum score
      if (score > 10) {
        results.push({ 
          item: tutorial, 
          score,
          type: 'tutorial'
        });
      }
    });
    
    // Sort results based on selected sort method
    const sortedResults = sortSearchResults(results, mergedOptions.sortBy || 'relevance');
    
    // Apply limit
    const limitedResults = sortedResults.slice(0, mergedOptions.limit);
    
    // Log debug info
    console.log(`Search: Found ${results.length} results for "${searchQuery}" (showing ${limitedResults.length})`);
    
    // Cache the results
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: limitedResults
    });
    
    return limitedResults;
    
  } catch (error) {
    console.error('Error searching Firebase:', error);
    return [];
  }
};

/**
 * Pure function to sort search results
 */
export const sortSearchResults = (
  results: SearchResult[], 
  sortBy: 'relevance' | 'date' | 'title'
): SearchResult[] => {
  if (sortBy === 'relevance') {
    return [...results].sort((a, b) => b.score - a.score);
  } else if (sortBy === 'date') {
    return [...results].sort((a, b) => {
      const dateA = new Date(a.item.updatedAt || a.item.createdAt);
      const dateB = new Date(b.item.updatedAt || b.item.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } else if (sortBy === 'title') {
    return [...results].sort((a, b) => a.item.title.localeCompare(b.item.title));
  }
  return results;
};

/**
 * Filter search results by tags (pure function)
 */
export const filterResultsByTags = (results: SearchResult[], tags: string[]): SearchResult[] => {
  if (!tags || tags.length === 0) return results;
  
  return results.filter(result => 
    tags.some(tag => result.item.tags.includes(tag))
  );
};

/**
 * Clear the search cache
 */
export const clearSearchCache = (): void => {
  searchCache.clear();
  console.log('Search cache cleared');
};

/**
 * Search with pagination support
 */
export const paginatedSearch = async (
  searchQuery: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  pageSize: number = 10,
  options: SearchOptions = defaultOptions
): Promise<{
  results: SearchResult[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return { results: [], lastDoc: null };
  }
  
  try {
    // First do a full search to compute relevance scores
    const allResults = await searchFirebase(searchQuery, options);
    
    // Get the starting index for pagination
    const startIdx = lastDoc ? parseInt(lastDoc.id, 10) : 0;
    const endIdx = Math.min(startIdx + pageSize, allResults.length);
    
    // Get the results for this page
    const results = allResults.slice(startIdx, endIdx);
    
    // Create a synthetic lastDoc for pagination
    const newLastDoc = endIdx < allResults.length ? 
      { id: endIdx.toString() } as QueryDocumentSnapshot<DocumentData> : 
      null;
    
    return {
      results,
      lastDoc: newLastDoc
    };
  } catch (error) {
    console.error('Error in paginated search:', error);
    return { results: [], lastDoc: null };
  }
};

/**
 * Get suggested search terms based on query
 * Returns tags and search phrases that match the query
 */
export const getSuggestedSearchTerms = async (
  query: string,
  limit: number = 5
): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();
    
    // Get all articles and tutorials to extract tags
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const tutorialsSnapshot = await getDocs(collection(db, 'tutorials'));
    
    // Process articles for tag suggestions
    articlesSnapshot.forEach(doc => {
      const article = doc.data() as Article;
      if (article.tags) {
        article.tags.forEach(tag => {
          if (tag.toLowerCase().includes(lowerQuery)) {
            suggestions.add(tag);
          }
        });
      }
    });
    
    // Process tutorials for tag suggestions
    tutorialsSnapshot.forEach(doc => {
      const tutorial = doc.data() as Tutorial;
      if (tutorial.tags) {
        tutorial.tags.forEach(tag => {
          if (tag.toLowerCase().includes(lowerQuery)) {
            suggestions.add(tag);
          }
        });
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}; 