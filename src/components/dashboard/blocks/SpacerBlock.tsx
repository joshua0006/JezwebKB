import React from 'react';

interface SpacerBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function SpacerBlock({ value, onChange }: SpacerBlockProps) {
  const [height, setHeight] = React.useState('medium');

  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setHeight(parsed.height || 'medium');
      } catch (e) {
        // Handle parse error
      }
    }
  }, [value]);

  const handleChange = (newHeight: string) => {
    const newValue = JSON.stringify({ height: newHeight });
    setHeight(newHeight);
    onChange(newValue);
  };

  const getHeightClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'h-4';
      case 'medium':
        return 'h-8';
      case 'large':
        return 'h-16';
      case 'xlarge':
        return 'h-24';
      default:
        return 'h-8';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Height
        </label>
        <select
          value={height}
          onChange={(e) => handleChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
        >
          <option value="small">Small (1rem)</option>
          <option value="medium">Medium (2rem)</option>
          <option value="large">Large (4rem)</option>
          <option value="xlarge">Extra Large (6rem)</option>
        </select>
      </div>

      <div className="pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="bg-gray-200 w-full rounded">
            <div className={`${getHeightClass(height)}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}