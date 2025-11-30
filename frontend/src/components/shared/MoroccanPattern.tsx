import React from 'react';

interface MoroccanPatternProps {
  className?: string;
  opacity?: number;
}

export const MoroccanPattern: React.FC<MoroccanPatternProps> = ({ 
  className = '', 
  opacity = 0.1 
}) => {
  return (
    <svg 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern 
          id="moroccan-pattern" 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          patternUnits="userSpaceOnUse"
        >
          <path 
            d="M50 0L60 20L80 20L65 32L70 52L50 40L30 52L35 32L20 20L40 20Z" 
            fill="currentColor" 
            className="text-primary-600"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="8" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-accent-500"
          />
          <path 
            d="M50 15L55 25L45 25Z" 
            fill="currentColor"
            className="text-primary-500"
          />
          <path 
            d="M50 85L55 75L45 75Z" 
            fill="currentColor"
            className="text-primary-500"
          />
          <path 
            d="M15 50L25 55L25 45Z" 
            fill="currentColor"
            className="text-primary-700"
          />
          <path 
            d="M85 50L75 55L75 45Z" 
            fill="currentColor"
            className="text-primary-700"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#moroccan-pattern)" className="text-primary-600" />
    </svg>
  );
};

