import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../lib/cn';

export interface SeparatorProps {
  className?: ViewStyle;
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, style, orientation = 'horizontal' }: SeparatorProps) {
  const separatorStyle: ViewStyle = {
    backgroundColor: colors.gray[200],
    ...(orientation === 'horizontal'
      ? { height: 1, width: '100%' }
      : { width: 1, height: '100%' }),
    ...className,
    ...style,
  };

  return <View style={separatorStyle} />;
}

