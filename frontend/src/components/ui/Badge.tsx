import React from 'react';

export interface BadgeProps {
  variant?: 'solid' | 'outlined' | 'dot';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  solid: '',
  outlined: 'bg-transparent border-2',
  dot: 'bg-transparent border-0 pl-0',
};

const colorStyles = {
  primary: {
    solid: 'bg-primary-100 text-primary-800',
    outlined: 'border border-primary-500 text-primary-700',
    dot: 'text-primary-700',
  },
  success: {
    solid: 'bg-success-100 text-success-800',
    outlined: 'border border-success-500 text-success-700',
    dot: 'text-success-700',
  },
  warning: {
    solid: 'bg-warning-100 text-warning-800',
    outlined: 'border border-warning-500 text-warning-700',
    dot: 'text-warning-700',
  },
  error: {
    solid: 'bg-error-100 text-error-800',
    outlined: 'border border-error-500 text-error-700',
    dot: 'text-error-700',
  },
  info: {
    solid: 'bg-secondary-100 text-secondary-800',
    outlined: 'border border-secondary-500 text-secondary-700',
    dot: 'text-secondary-700',
  },
  gray: {
    solid: 'bg-gray-100 text-gray-800',
    outlined: 'border border-gray-500 text-gray-700',
    dot: 'text-gray-700',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'solid',
  color = 'primary',
  size = 'md',
  className = '',
  children,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  const colorStyle = colorStyles[color][variant];
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];
  
  const classes = `${baseStyles} ${colorStyle} ${sizeStyle} ${variantStyle} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <span className={classes}>
      {variant === 'dot' && (
        <span className={`w-2 h-2 rounded-full mr-1.5 ${colorStyles[color].solid.split(' ')[0]}`} />
      )}
      {children}
    </span>
  );
};

