import React from 'react';

interface ZellijPatternProps {
  className?: string;
  opacity?: number;
  variant?: 'classic' | 'star' | 'honeycomb' | 'interlaced';
}

export const ZellijPattern: React.FC<ZellijPatternProps> = ({
  className = '',
  opacity = 0.1,
  variant = 'classic',
}) => {
  const baseStyles = `absolute inset-0 w-full h-full pointer-events-none ${className}`;
  const style = { opacity };

  if (variant === 'star') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zellij-star" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Central star */}
              <polygon
                points="60,10 70,40 100,40 75,60 85,90 60,75 35,90 45,60 20,40 50,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-600"
              />
              {/* Inner hexagon */}
              <polygon
                points="60,25 75,40 75,60 60,70 45,60 45,40"
                fill="currentColor"
                className="text-primary-500"
              />
              {/* Corner hexagons */}
              <polygon
                points="20,20 30,25 30,35 20,40 10,35 10,25"
                fill="currentColor"
                className="text-accent-500"
              />
              <polygon
                points="100,20 110,25 110,35 100,40 90,35 90,25"
                fill="currentColor"
                className="text-accent-500"
              />
              <polygon
                points="20,80 30,85 30,95 20,100 10,95 10,85"
                fill="currentColor"
                className="text-accent-500"
              />
              <polygon
                points="100,80 110,85 110,95 100,100 90,95 90,85"
                fill="currentColor"
                className="text-accent-500"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zellij-star)" />
        </svg>
      </div>
    );
  }

  if (variant === 'honeycomb') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zellij-honeycomb" x="0" y="0" width="104" height="120" patternUnits="userSpaceOnUse">
              {/* Main hexagon */}
              <polygon
                points="52,5 97,30 97,75 52,100 7,75 7,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-600"
              />
              {/* Inner hexagon */}
              <polygon
                points="52,20 82,35 82,65 52,80 22,65 22,35"
                fill="currentColor"
                className="text-primary-500"
              />
              {/* Center circle */}
              <circle cx="52" cy="50" r="8" fill="currentColor" className="text-accent-500" />
              {/* Side hexagons */}
              <polygon
                points="7,52.5 22,60 22,75 7,82.5 -8,75 -8,60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary-400"
              />
              <polygon
                points="97,52.5 112,60 112,75 97,82.5 82,75 82,60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary-400"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zellij-honeycomb)" />
        </svg>
      </div>
    );
  }

  if (variant === 'interlaced') {
    return (
      <div className={baseStyles} style={style}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zellij-interlaced" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
              {/* Large hexagon */}
              <polygon
                points="75,10 125,40 125,90 75,120 25,90 25,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary-600"
              />
              {/* Interlaced lines */}
              <path
                d="M75,10 L25,40 L25,90 L75,120 L125,90 L125,40 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary-500"
              />
              <path
                d="M50,25 L100,25 L125,40 L100,55 L50,55 L25,40 Z"
                fill="currentColor"
                className="text-primary-400"
              />
              <path
                d="M50,85 L100,85 L125,100 L100,115 L50,115 L25,100 Z"
                fill="currentColor"
                className="text-primary-400"
              />
              {/* Center star */}
              <polygon
                points="75,50 85,65 100,65 88,75 92,90 75,82 58,90 62,75 50,65 65,65"
                fill="currentColor"
                className="text-accent-500"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zellij-interlaced)" />
        </svg>
      </div>
    );
  }

  // Classic zellij pattern
  return (
    <div className={baseStyles} style={style}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="zellij-classic" x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
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
        <rect width="100%" height="100%" fill="url(#zellij-classic)" />
      </svg>
    </div>
  );
};

