import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
          ${variant === 'default' ? 'bg-indigo-100 text-indigo-800' : ''}
          ${variant === 'secondary' ? 'bg-gray-100 text-gray-600' : ''}
          ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge'; 