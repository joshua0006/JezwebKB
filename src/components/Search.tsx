import { useState, useRef, useEffect } from 'react';
import { searchTutorials } from '../utils/search';
import { tutorials } from '../data/tutorials';
import { Link } from 'react-router-dom';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        const searchResults = searchTutorials(query, tutorials);
        setResults(searchResults.slice(0, 5)); // Limit to 5 results
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    }
    // Enter
    else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        setQuery(selected.title);
        setIsOpen(false);
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative flex-1 max-w-lg" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search tutorials..."
          className="w-full px-4 py-2 text-sm bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-300"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {results.map((tutorial, index) => (
            <Link
              key={tutorial.id}
              to={`/tutorials/${tutorial.id}`}
              className={`block px-4 py-2 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
              onClick={() => {
                setQuery(tutorial.title);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {tutorial.title}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {tutorial.description}
                </span>
                <div className="flex gap-2 mt-1">
                  {tutorial.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Search; 