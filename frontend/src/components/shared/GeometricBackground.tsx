import React from 'react';

interface GeometricBackgroundProps {
  variant?: 'default' | 'circles' | 'triangles' | 'hexagons' | 'waves' | 'zellij';
  opacity?: number;
  className?: string;
}

export const GeometricBackground: React.FC<GeometricBackgroundProps> = ({
  variant = 'default',
  opacity = 0.1,
  className = '',
}) => {
  const baseStyles = `absolute inset-0 w-full h-full pointer-events-none ${className}`;
  const style = { opacity };

  if (variant === 'circles') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circles-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-600" />
              <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-500" />
              <circle cx="60" cy="60" r="10" fill="currentColor" className="text-accent-500" />
              <circle cx="20" cy="20" r="8" fill="currentColor" className="text-primary-400" />
              <circle cx="100" cy="20" r="6" fill="currentColor" className="text-primary-400" />
              <circle cx="20" cy="100" r="6" fill="currentColor" className="text-primary-400" />
              <circle cx="100" cy="100" r="8" fill="currentColor" className="text-primary-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circles-pattern)" />
        </svg>
      </div>
    );
  }

  if (variant === 'triangles') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="triangles-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <polygon points="50,10 90,80 10,80" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-600" />
              <polygon points="50,30 70,70 30,70" fill="currentColor" className="text-primary-500" />
              <polygon points="25,50 35,70 15,70" fill="currentColor" className="text-accent-500" />
              <polygon points="75,50 85,70 65,70" fill="currentColor" className="text-accent-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#triangles-pattern)" />
        </svg>
      </div>
    );
  }

  if (variant === 'hexagons' || variant === 'zellij') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons-pattern" x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
              {/* Main hexagon */}
              <polygon
                points="60,5 110,30 110,75 60,100 10,75 10,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary-600"
              />
              {/* Inner hexagon */}
              <polygon
                points="60,20 95,37.5 95,67.5 60,85 25,67.5 25,37.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary-500"
              />
              {/* Center star */}
              <polygon
                points="60,40 70,50 60,60 50,50"
                fill="currentColor"
                className="text-accent-500"
              />
              <polygon
                points="60,50 75,45 80,50 75,55 60,60 45,55 40,50 45,45"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-accent-500"
              />
              {/* Corner decorations */}
              <circle cx="10" cy="30" r="4" fill="currentColor" className="text-primary-400" />
              <circle cx="110" cy="30" r="4" fill="currentColor" className="text-primary-400" />
              <circle cx="10" cy="75" r="4" fill="currentColor" className="text-primary-400" />
              <circle cx="110" cy="75" r="4" fill="currentColor" className="text-primary-400" />
              {/* Side hexagons */}
              <polygon
                points="5,52.5 15,57.5 15,67.5 5,72.5 -5,67.5 -5,57.5"
                fill="currentColor"
                className="text-primary-300"
              />
              <polygon
                points="115,52.5 125,57.5 125,67.5 115,72.5 105,67.5 105,57.5"
                fill="currentColor"
                className="text-primary-300"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons-pattern)" />
        </svg>
      </div>
    );
  }

  if (variant === 'waves') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="waves-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path
                d="M0,100 Q50,50 100,100 T200,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-600"
              />
              <path
                d="M0,120 Q50,70 100,120 T200,120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-500"
              />
              <path
                d="M0,80 Q50,130 100,80 T200,80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-500"
              />
              <circle cx="50" cy="100" r="6" fill="currentColor" className="text-accent-500" />
              <circle cx="150" cy="100" r="6" fill="currentColor" className="text-accent-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves-pattern)" />
        </svg>
      </div>
    );
  }

  // Default: Mixed geometric shapes
  return (
    <div className={baseStyles} style={style}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geometric-pattern" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
            {/* Large circle */}
            <circle cx="75" cy="75" r="50" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-600" />
            {/* Medium circle */}
            <circle cx="75" cy="75" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-500" />
            {/* Small filled circle */}
            <circle cx="75" cy="75" r="12" fill="currentColor" className="text-accent-500" />
            {/* Corner triangles */}
            <polygon points="75,10 90,40 60,40" fill="currentColor" className="text-primary-400" />
            <polygon points="75,140 90,110 60,110" fill="currentColor" className="text-primary-400" />
            <polygon points="10,75 40,60 40,90" fill="currentColor" className="text-primary-400" />
            <polygon points="140,75 110,60 110,90" fill="currentColor" className="text-primary-400" />
            {/* Hexagon */}
            <polygon
              points="75,25 95,35 95,55 75,65 55,55 55,35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-accent-500"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
      </svg>
    </div>
  );
};

