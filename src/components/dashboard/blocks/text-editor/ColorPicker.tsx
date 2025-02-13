import React from 'react';
import { X } from 'lucide-react';

interface ColorPickerProps {
  colors: string[];
  onSelect: (color: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function ColorPicker({ colors, onSelect, onRemove, showRemove = false }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 min-w-[180px] p-1">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm"
          style={{ backgroundColor: color }}
          title={color}
          type="button"
        />
      ))}
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform flex items-center justify-center bg-white shadow-sm"
          title="Remove"
          type="button"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}