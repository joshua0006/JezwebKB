import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useEffect, useState } from 'react';

export function Breadcrumbs() {
  const { breadcrumbs, previousBreadcrumbs, isLoading } = useBreadcrumbs();
  const [progressWidth, setProgressWidth] = useState(0);
  
  // Determine which breadcrumbs to display based on loading state
  const displayBreadcrumbs = isLoading ? previousBreadcrumbs : breadcrumbs;
  
  // Progress bar animation
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;
    const duration = 1000; // Duration in ms, matching the LOADING_TIMEOUT

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      setProgressWidth(progress * 100);
      
      if (progress < 1 && isLoading) {
        animationFrame = requestAnimationFrame(animate);
      } else if (!isLoading) {
        // If loading finished, quickly complete the progress bar
        setProgressWidth(100);
        setTimeout(() => setProgressWidth(0), 200);
      }
    };

    if (isLoading) {
      setProgressWidth(0);
      animationFrame = requestAnimationFrame(animate);
    } else {
      setProgressWidth(0);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isLoading]);

  // Create skeleton breadcrumbs for loading state when no previous breadcrumbs
  const renderSkeletonBreadcrumbs = () => {
    if (!isLoading) return null;
    
    // Use previous breadcrumbs as a template if available
    const templateItems = previousBreadcrumbs.length ? previousBreadcrumbs : [
      { label: "Loading" }, 
      { label: "Loading" }
    ];
    
    return templateItems.map((_, index) => (
      <div key={`skeleton-${index}`} className="flex items-center" aria-hidden="true">
        <ChevronRight className="h-4 w-4 mx-2 text-gray-300" />
        <div 
          className="h-4 rounded w-16 bg-gray-200 animate-pulse"
          style={{
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%'
          }}
        />
      </div>
    ));
  };

  // If there are no breadcrumbs to show, don't render anything
  if (!displayBreadcrumbs.length && !isLoading) {
    return null;
  }

  return (
    <div className="relative">
      {/* Progress Bar */}
      {isLoading || progressWidth > 0 ? (
        <div 
          className="absolute top-0 left-0 w-full h-0.5 bg-gray-200 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressWidth}
        >
          <div 
            className="h-full bg-indigo-600 transition-all duration-200 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      ) : null}
      
      <nav 
        className="flex items-center space-x-2 text-sm text-gray-500 mb-8 min-h-[32px] pt-2" 
        aria-label="Breadcrumb"
        role="navigation"
      >
        <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
          <Link 
            to="/" 
            className="flex items-center hover:text-indigo-600 transition-colors"
            aria-label="Home"
            tabIndex={isLoading ? -1 : 0}
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
        </div>
        
        {/* Existing breadcrumbs with transition */}
        {displayBreadcrumbs.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}
          >
            <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
            {item.path ? (
              <Link 
                to={item.path}
                className="hover:text-indigo-600 transition-colors"
                tabIndex={isLoading ? -1 : 0}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className="text-gray-900 font-medium" 
                aria-current={!isLoading ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        ))}
        
        {/* Skeleton loaders for transitions */}
        {isLoading && breadcrumbs.length === 0 && renderSkeletonBreadcrumbs()}
        
        {/* Loading indicator for ARIA */}
        {isLoading && (
          <div className="sr-only" role="status" aria-live="polite">
            Loading page navigation
          </div>
        )}
      </nav>
    </div>
  );
} 