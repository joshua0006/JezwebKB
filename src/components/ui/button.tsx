import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary';
  size?: 'default' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
          ${variant === 'default' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
          ${variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : ''}
          ${size === 'default' ? 'h-10 px-4 py-2' : 'h-9 px-3 text-xs'}
          disabled:opacity-50 disabled:pointer-events-none
          ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button'; 