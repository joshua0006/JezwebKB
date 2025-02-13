import React from 'react';
import { Search, Heart } from 'lucide-react';
import { iconMap } from '../../../data/icons';

interface IconBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  onClose: () => void;
}

// Create a list of icon names
const iconList = Object.keys(iconMap);

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIcon, setSelectedIcon] = React.useState(value);

  const filteredIcons = React.useMemo(() => {
    return iconList.filter((iconName) => 
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    onChange(iconName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="icon-picker-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="icon-picker-title">
                  Select an Icon
                </h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search icons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Search Results Count */}
                <div className="text-sm text-gray-500 mb-2">
                  {filteredIcons.length} icons found
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto p-2">
                  {filteredIcons.map((iconName) => {
                    const IconComponent = iconMap[iconName as keyof typeof iconMap];
                    return (
                      <button
                        key={iconName}
                        onClick={() => handleSelect(iconName)}
                        className={`p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center gap-1 ${
                          selectedIcon === iconName ? 'bg-indigo-50 ring-2 ring-indigo-500' : ''
                        }`}
                        title={iconName}
                      > 
                        <IconComponent className="h-6 w-6" />
                      </button>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-6 py-8 text-center text-gray-500">
                      No icons found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconBlock({ value, onChange }: IconBlockProps) {
  const [icon, setIcon] = React.useState('Heart');
  const [size, setSize] = React.useState('medium');
  const [color, setColor] = React.useState('indigo');
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setIcon(parsed.icon || 'Heart');
        setSize(parsed.size || 'medium');
        setColor(parsed.color || 'indigo');
      } catch (e) {
        // Handle parse error
      }
    }
  }, [value]);

  const handleChange = (updates: { icon?: string; size?: string; color?: string }) => {
    const newValue = JSON.stringify({
      icon: updates.icon ?? icon,
      size: updates.size ?? size,
      color: updates.color ?? color,
    });
    onChange(newValue);
  };

  const IconComponent = iconMap[icon as keyof typeof iconMap] || Heart;

  const getSizeClass = (iconSize: string) => {
    switch (iconSize) {
      case 'small':
        return 'h-4 w-4';
      case 'medium':
        return 'h-6 w-6';
      case 'large':
        return 'h-8 w-8';
      case 'xlarge':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getColorClass = (iconColor: string) => {
    switch (iconColor) {
      case 'gray':
        return 'text-gray-600';
      case 'indigo':
        return 'text-indigo-600';
      case 'red':
        return 'text-red-600';
      case 'green':
        return 'text-green-600';
      default:
        return 'text-indigo-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Icon
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              <span className="text-sm text-gray-700">{icon}</span>
            </div>
            <span className="text-xs text-gray-500">Change</span>
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              handleChange({ size: e.target.value });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white transition-colors cursor-pointer hover:bg-gray-50"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
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
        <div className="p-4 bg-gray-50 rounded-md flex items-center justify-center">
          <IconComponent className={`${getSizeClass(size)} ${getColorClass(color)}`} />
        </div>
      </div>

      {showPicker && (
        <IconPicker
          value={icon}
          onChange={(newIcon) => {
            setIcon(newIcon);
            handleChange({ icon: newIcon });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}