import React from 'react';
import { Link2 } from 'lucide-react';

interface ButtonBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function ButtonBlock({ value, onChange }: ButtonBlockProps) {
  const [text, setText] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [variant, setVariant] = React.useState('primary');

  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setText(parsed.text || '');
        setUrl(parsed.url || '');
        setVariant(parsed.variant || 'primary');
      } catch (e) {
        // Handle parse error
      }
    }
  }, [value]);

  const handleChange = (updates: { text?: string; url?: string; variant?: string }) => {
    const newValue = JSON.stringify({
      text: updates.text ?? text,
      url: updates.url ?? url,
      variant: updates.variant ?? variant,
    });
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleChange({ text: e.target.value });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="Click me"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                handleChange({ url: e.target.value });
              }}
              className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Style
        </label>
        <select
          value={variant}
          onChange={(e) => {
            setVariant(e.target.value);
            handleChange({ variant: e.target.value });
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>

      <div className="pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div className="p-4 bg-gray-50 rounded-md flex items-center justify-center">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              variant === 'primary'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : variant === 'secondary'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : variant === 'outline'
                ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {text || 'Button Text'}
          </button>
        </div>
      </div>
    </div>
  );
}