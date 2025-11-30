import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle, Polygon, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

interface GeometricPatternProps {
  variant?: 'default' | 'circles' | 'triangles' | 'hexagons' | 'waves' | 'zellij';
  opacity?: number;
  style?: any;
}

export const GeometricPattern: React.FC<GeometricPatternProps> = ({
  variant = 'zellij',
  opacity = 0.05,
  style,
}) => {
  const patternId = `pattern-${variant}`;
  const color = colors.primary[600];

  const renderPattern = () => {
    switch (variant) {
      case 'circles':
        return (
          <Pattern id={patternId} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <Circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="2" />
            <Circle cx="60" cy="60" r="25" fill="none" stroke={color} strokeWidth="1.5" />
            <Circle cx="60" cy="60" r="10" fill={colors.accent[500]} />
            <Circle cx="20" cy="20" r="8" fill={colors.primary[400]} />
            <Circle cx="100" cy="20" r="6" fill={colors.primary[400]} />
            <Circle cx="20" cy="100" r="6" fill={colors.primary[400]} />
            <Circle cx="100" cy="100" r="8" fill={colors.primary[400]} />
          </Pattern>
        );

      case 'triangles':
        return (
          <Pattern id={patternId} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <Polygon points="50,10 90,80 10,80" fill="none" stroke={color} strokeWidth="2" />
            <Polygon points="50,30 70,70 30,70" fill={colors.primary[500]} />
            <Polygon points="25,50 35,70 15,70" fill={colors.accent[500]} />
            <Polygon points="75,50 85,70 65,70" fill={colors.accent[500]} />
          </Pattern>
        );

      case 'hexagons':
        return (
          <Pattern id={patternId} x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
            <Polygon
              points="60,5 110,30 110,75 60,100 10,75 10,30"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <Polygon
              points="60,20 95,37.5 95,67.5 60,85 25,67.5 25,37.5"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <Polygon points="60,40 70,50 60,60 50,50" fill={colors.accent[500]} />
            <Circle cx="10" cy="30" r="4" fill={colors.primary[400]} />
            <Circle cx="110" cy="30" r="4" fill={colors.primary[400]} />
            <Circle cx="10" cy="75" r="4" fill={colors.primary[400]} />
            <Circle cx="110" cy="75" r="4" fill={colors.primary[400]} />
          </Pattern>
        );

      case 'waves':
        return (
          <Pattern id={patternId} x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <Path
              d="M0,100 Q50,50 100,100 T200,100"
              fill="none"
              stroke={color}
              strokeWidth="3"
            />
            <Path
              d="M0,120 Q50,70 100,120 T200,120"
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M0,80 Q50,130 100,80 T200,80"
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            <Circle cx="50" cy="100" r="6" fill={colors.accent[500]} />
            <Circle cx="150" cy="100" r="6" fill={colors.accent[500]} />
          </Pattern>
        );

      case 'zellij':
      default:
        return (
          <Pattern id={patternId} x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
            {/* Main hexagon */}
            <Polygon
              points="60,5 110,30 110,75 60,100 10,75 10,30"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {/* Inner hexagon */}
            <Polygon
              points="60,20 95,37.5 95,67.5 60,85 25,67.5 25,37.5"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            {/* Center star */}
            <Polygon points="60,40 70,50 60,60 50,50" fill={colors.accent[500]} />
            <Polygon
              points="60,50 75,45 80,50 75,55 60,60 45,55 40,50 45,45"
              fill="none"
              stroke={colors.accent[500]}
              strokeWidth="1"
            />
            {/* Corner decorations */}
            <Circle cx="10" cy="30" r="4" fill={colors.primary[400]} />
            <Circle cx="110" cy="30" r="4" fill={colors.primary[400]} />
            <Circle cx="10" cy="75" r="4" fill={colors.primary[400]} />
            <Circle cx="110" cy="75" r="4" fill={colors.primary[400]} />
            {/* Side hexagons */}
            <Polygon
              points="5,52.5 15,57.5 15,67.5 5,72.5 -5,67.5 -5,57.5"
              fill={colors.primary[300]}
            />
            <Polygon
              points="115,52.5 125,57.5 125,67.5 115,72.5 105,67.5 105,57.5"
              fill={colors.primary[300]}
            />
          </Pattern>
        );
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { opacity, pointerEvents: 'none' }, style]}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>{renderPattern()}</Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
};

