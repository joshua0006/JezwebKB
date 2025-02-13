import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  icon: LucideIcon;
}

export function ToolbarButton({ onClick, isActive, disabled, title, icon: Icon }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`p-2 rounded hover:bg-gray-100 ${
        isActive ? 'bg-gray-100' : ''
      } disabled:opacity-50`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}