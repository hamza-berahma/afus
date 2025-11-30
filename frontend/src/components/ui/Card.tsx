import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  hoverable?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-white shadow-sm border border-gray-200',
  outlined: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-md border border-gray-200',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverable = false,
  onClick,
  header,
  footer,
  className = '',
  children,
}) => {
  const baseStyles = 'rounded-lg overflow-hidden transition-all duration-200';
  const classes = `${baseStyles} ${variantStyles[variant]} ${hoverable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${className}`.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">
          {header}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </>
  );

  if (onClick || hoverable) {
    return (
      <motion.div
        whileHover={hoverable ? { y: -4 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
        className={classes}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        aria-label={onClick ? 'Clickable card' : undefined}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={classes}>{content}</div>;
};

