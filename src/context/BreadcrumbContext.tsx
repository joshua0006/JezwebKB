import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  previousBreadcrumbs: BreadcrumbItem[];
  isLoading: boolean;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

const LOADING_TIMEOUT = 1000; // Maximum duration for loading animation (ms)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);
  const [previousBreadcrumbs, setPreviousBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading animation when navigation occurs
    setIsLoading(true);
    setPreviousBreadcrumbs(breadcrumbs);
    
    // Set a maximum duration for the loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
    setIsLoading(false);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ 
      breadcrumbs, 
      previousBreadcrumbs, 
      isLoading, 
      setBreadcrumbs 
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
} 