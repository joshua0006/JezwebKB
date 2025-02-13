import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Filter out any "tutorials" items from the breadcrumb path
  const filteredItems = items.filter(item => 
    item.label.toLowerCase() !== 'tutorials'
  );

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
      <Link 
        to="/" 
        className="flex items-center hover:text-indigo-600 transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </Link>
      
      {filteredItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2" />
          {item.path ? (
            <Link 
              to={item.path}
              className="hover:text-indigo-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
} 