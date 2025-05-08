import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SEO } from './SEO';
import { Breadcrumbs } from './Breadcrumbs';
import { useBreadcrumbsGenerator } from '../hooks/useBreadcrumbsGenerator';
import { ErrorBoundary } from 'react-error-boundary';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useEffect } from 'react';

// Fallback component for error states
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const location = useLocation();
  
  // Set an error breadcrumb
  useEffect(() => {
    setBreadcrumbs([{ label: 'Error' }]);
  }, [setBreadcrumbs, location.pathname]);

  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="mb-4 text-gray-700">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export function Layout() {
  // Initialize breadcrumbs
  useBreadcrumbsGenerator();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Web Development Tutorials & Guides" 
        description="Find comprehensive guides, tutorials, and help for managing your website effectively with WordPress, Elementor, and more."
      />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Breadcrumbs />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
} 