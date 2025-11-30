import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { cn } from '../../lib/cn';

export interface SkeletonProps {
  className?: ViewStyle;
  style?: ViewStyle;
  width?: number | string;
  height?: number;
}

export function Skeleton({ className, style, width, height = 20 }: SkeletonProps) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  const skeletonStyle: ViewStyle = {
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[200] as string,
    width: (width || '100%') as any,
    height,
    ...className,
    ...style,
  };

  return (
    <Animated.View
      style={[
        skeletonStyle,
        {
          opacity: fadeAnim,
        },
      ]}
    />
  );
}

