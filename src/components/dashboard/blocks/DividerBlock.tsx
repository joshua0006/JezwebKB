import React from 'react';

interface DividerBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function DividerBlock({ value, onChange }: DividerBlockProps) {
  const [style, setStyle] = React.useState('solid');
  const [width, setWidth] = React.useState('full');
  const [color, setColor] = React.useState('gray');

  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setStyle(parsed.style || 'solid');
        setWidth(parsed.width || 'full');
        setColor(parsed.color || 'gray');
      } catch (e) {
        // Handle parse error
      }
    }
  }, [value]);

  const handleChange = (updates: { style?: string; width?: string; color?: string }) => {
    const newValue = JSON.stringify({
      style: updates.style ?? style,
      width: updates.width ?? width,
      color: updates.color ?? color,
    });
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Style
          </label>
          <select
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              handleChange({ style: e.target.value });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width
          </label>
          <select
            value={width}
            onChange={(e) => {
              setWidth(e.target.value);
              handleChange({ width: e.target.value });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
          >
            <option value="full">Full</option>
            <option value="3/4">75%</option>
            <option value="1/2">50%</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <select
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              handleChange({ color: e.target.value });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
          >
            <option value="gray">Gray</option>
            <option value="indigo">Indigo</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
          </select>
        </div>
      </div>

      <div className="pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div className="p-4 bg-gray-50 rounded-md">
          <hr
            className={`
              ${width === 'full' ? 'w-full' : width === '3/4' ? 'w-3/4' : 'w-1/2'}
              mx-auto
              ${style === 'solid' ? 'border-solid' : style === 'dashed' ? 'border-dashed' : 'border-dotted'}
              ${
                color === 'gray'
                  ? 'border-gray-300'
                  : color === 'indigo'
                  ? 'border-indigo-500'
                  : color === 'red'
                  ? 'border-red-500'
                  : 'border-green-500'
              }
            `}
          />
        </div>
      </div>
    </div>
  );
}