import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useBreadcrumbs, BreadcrumbItem } from '../context/BreadcrumbContext';

// Map of route patterns to generate breadcrumb items
const routeToBreadcrumb: Record<string, (params?: Record<string, string>) => BreadcrumbItem[]> = {
  // Home page
  '/': () => [],
  
  // Articles listing
  '/articles': () => [
    { label: 'Articles' }
  ],
  
  // Single article
  '/article/:articleId': (params) => [
    { label: 'Articles', path: '/articles' },
    { label: params?.articleId ? 'Article' : 'Article not found' }
  ],
  
  // Category view
  '/categories/:categoryId': (params) => [
    { label: params?.categoryId 
      ? params.categoryId.charAt(0).toUpperCase() + params.categoryId.slice(1).replace('-', ' ') 
      : 'Category' 
    }
  ],
  
  // Tutorial view
  '/tutorials/:tutorialId': (params) => [
    { label: 'Articles', path: '/articles' },
    { label: 'Tutorials', path: '/articles' },
    { label: params?.tutorialId ? 'Tutorial' : 'Tutorial not found' }
  ],
  
  // Other static pages
  '/about': () => [
    { label: 'About Us' }
  ],
  
  '/privacy-policy': () => [
    { label: 'Privacy Policy' }
  ],
  
  '/terms-of-service': () => [
    { label: 'Terms of Service' }
  ],
  
  // User section
  '/dashboard': () => [
    { label: 'Dashboard' }
  ],
  
  '/profile-settings': () => [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile Settings' }
  ],
  
  // Admin section
  '/admin': () => [
    { label: 'Admin Dashboard' }
  ],
  
  '/admin/users': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'User Management' }
  ],
  
  '/admin/articles': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Article Management' }
  ],
  
  '/admin/articles/new': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Article Management', path: '/admin/articles' },
    { label: 'New Article' }
  ],
  
  '/admin/articles/:id/edit': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Article Management', path: '/admin/articles' },
    { label: 'Edit Article' }
  ],
  
  '/admin/tools': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Tools' }
  ],
  
  '/admin/notifications': () => [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Notifications' }
  ],
};

// Find the matching route pattern for the current path
const findMatchingRoute = (pathname: string): [string, Record<string, string>] => {
  // Direct match
  if (routeToBreadcrumb[pathname]) {
    return [pathname, {}];
  }
  
  // Process path segments to find match with parameters
  const pathSegments = pathname.split('/').filter(Boolean);
  const routePatterns = Object.keys(routeToBreadcrumb);
  
  for (const pattern of routePatterns) {
    const patternSegments = pattern.split('/').filter(Boolean);
    
    if (pathSegments.length !== patternSegments.length) {
      continue;
    }
    
    const params: Record<string, string> = {};
    let isMatch = true;
    
    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(':')) {
        // Parameter segment
        const paramName = patternSegments[i].substring(1);
        params[paramName] = pathSegments[i];
      } else if (patternSegments[i] !== pathSegments[i]) {
        // Static segment doesn't match
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) {
      return [pattern, params];
    }
  }
  
  // Default: no match found
  return ['/', {}];
};

export function useBreadcrumbsGenerator() {
  const location = useLocation();
  const urlParams = useParams<Record<string, string>>();
  const { setBreadcrumbs } = useBreadcrumbs();
  
  useEffect(() => {
    const [matchedRoute, params] = findMatchingRoute(location.pathname);
    const breadcrumbGenerator = routeToBreadcrumb[matchedRoute];
    
    // Combine URL params from react-router with our detected params
    // Filter out any undefined values from urlParams
    const typedParams: Record<string, string> = {};
    Object.entries(urlParams).forEach(([key, value]) => {
      if (value !== undefined) {
        typedParams[key] = value;
      }
    });
    
    const allParams = { ...params, ...typedParams };
    
    if (breadcrumbGenerator) {
      setBreadcrumbs(breadcrumbGenerator(allParams));
    } else {
      // Default to empty breadcrumb for unmatched routes
      setBreadcrumbs([]);
    }
  }, [location.pathname, urlParams, setBreadcrumbs]);
} 