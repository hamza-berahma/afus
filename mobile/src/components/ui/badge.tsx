import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme/spacing';
import { cn, cva } from '../../lib/cn';

const badgeVariants = cva(
  {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  } as ViewStyle,
  {
    variant: {
      default: {
        backgroundColor: colors.primary[600],
        borderColor: 'transparent',
      } as ViewStyle,
      secondary: {
        backgroundColor: colors.gray[100],
        borderColor: 'transparent',
      } as ViewStyle,
      destructive: {
        backgroundColor: colors.error[500],
        borderColor: 'transparent',
      } as ViewStyle,
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.gray[200],
      } as ViewStyle,
      success: {
        backgroundColor: colors.success[500],
        borderColor: 'transparent',
      } as ViewStyle,
      warning: {
        backgroundColor: colors.warning[500],
        borderColor: 'transparent',
      } as ViewStyle,
    },
  }
);

const badgeTextVariants = cva(
  {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  {
    variant: {
      default: {
        color: colors.white,
      } as TextStyle,
      secondary: {
        color: colors.gray[700],
      } as TextStyle,
      destructive: {
        color: colors.white,
      } as TextStyle,
      outline: {
        color: colors.gray[700],
      } as TextStyle,
      success: {
        color: colors.white,
      } as TextStyle,
      warning: {
        color: colors.white,
      } as TextStyle,
    },
  }
);

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: ViewStyle;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', className, style }: BadgeProps) {
  const badgeStyle = badgeVariants({ variant });
  const textStyle = badgeTextVariants({ variant });

  return (
    <View style={cn(badgeStyle, className, style)}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

