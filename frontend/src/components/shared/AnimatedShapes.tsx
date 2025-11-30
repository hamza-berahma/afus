import React, { useMemo } from 'react';

interface AnimatedShapesProps {
  className?: string;
  count?: number;
}

export const AnimatedShapes: React.FC<AnimatedShapesProps> = ({
  className = '',
  count = 6,
}) => {
  const shapes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 50 + (i % 3) * 30,
      left: (i * 15) % 85 + 5,
      top: (i * 20) % 80 + 10,
      delay: (i * 0.5) % 3,
      duration: 12 + (i % 4) * 3,
      shape: ['circle', 'triangle', 'hexagon'][i % 3] as 'circle' | 'triangle' | 'hexagon',
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}>
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute opacity-10 animate-float"
          style={{
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            animationDuration: `${shape.duration}s`,
            animationDelay: `${shape.delay}s`,
          }}
        >
          {shape.shape === 'circle' && (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30" />
          )}
          {shape.shape === 'triangle' && (
            <div
              className="w-full h-full"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                background: 'linear-gradient(to bottom, rgba(74, 155, 127, 0.2), rgba(212, 175, 55, 0.2))',
              }}
            />
          )}
          {shape.shape === 'hexagon' && (
            <div
              className="w-full h-full"
              style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: 'linear-gradient(135deg, rgba(74, 155, 127, 0.2), rgba(212, 175, 55, 0.2))',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

