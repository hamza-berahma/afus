import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSize, fontWeight } from '../../theme/spacing';
import { cn } from '../../lib/cn';

export interface LabelProps {
  children: React.ReactNode;
  className?: TextStyle;
  style?: TextStyle;
  required?: boolean;
}

export function Label({ children, className, style, required }: LabelProps) {
  return (
    <Text
      style={cn(
        {
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: colors.gray[700],
          marginBottom: 8,
        },
        className,
        style
      )}
    >
      {children}
      {required && <Text style={{ color: colors.error[500] }}> *</Text>}
    </Text>
  );
}

