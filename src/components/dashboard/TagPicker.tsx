import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags: Tag[];
}

export function TagPicker({ selectedTags, onChange, availableTags }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customTag, setCustomTag] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  );

  const handleAddTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onChange([...selectedTags, tagName]);
    }
    setSearchTerm('');
    setCustomTag('');
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(selectedTags.filter(tag => tag !== tagName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag) {
      e.preventDefault();
      handleAddTag(customTag.trim());
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-2 text-indigo-600 hover:text-indigo-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCustomTag(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 text-sm"
          placeholder="Search or add tags..."
        />

        {/* Dropdown */}
        {isOpen && (searchTerm || filteredTags.length > 0) && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
            {filteredTags.length > 0 ? (
              <ul className="py-1">
                {filteredTags.map(tag => (
                  <li
                    key={tag.id}
                    onClick={() => handleAddTag(tag.name)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2 text-gray-400" />
                    {tag.name}
                  </li>
                ))}
              </ul>
            ) : searchTerm && (
              <div
                onClick={() => handleAddTag(searchTerm)}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2 text-gray-400" />
                Create tag "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="tags"
        value={selectedTags.join(',')}
      />
    </div>
  );
}