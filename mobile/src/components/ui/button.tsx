import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme/spacing';
import { cn, cva } from '../../lib/cn';

const buttonVariants = cva(
  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  {
    variant: {
      default: {
        backgroundColor: colors.primary[600],
      } as ViewStyle,
      destructive: {
        backgroundColor: colors.error[600],
      } as ViewStyle,
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary[600],
      } as ViewStyle,
      secondary: {
        backgroundColor: colors.gray[100],
      } as ViewStyle,
      ghost: {
        backgroundColor: 'transparent',
      } as ViewStyle,
      link: {
        backgroundColor: 'transparent',
      } as ViewStyle,
    },
    size: {
      default: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 48,
      } as ViewStyle,
      sm: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 40,
      } as ViewStyle,
      lg: {
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        minHeight: 56,
      } as ViewStyle,
      icon: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        minHeight: 48,
        minWidth: 48,
      } as ViewStyle,
    },
  }
);

const textVariants = cva(
  {
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  {
    variant: {
      default: {
        color: colors.white,
      } as TextStyle,
      destructive: {
        color: colors.white,
      } as TextStyle,
      outline: {
        color: colors.primary[600],
      } as TextStyle,
      secondary: {
        color: colors.gray[700],
      } as TextStyle,
      ghost: {
        color: colors.gray[700],
      } as TextStyle,
      link: {
        color: colors.primary[600],
        textDecorationLine: 'underline',
      } as TextStyle,
    },
    size: {
      default: {
        fontSize: fontSize.base,
      } as TextStyle,
      sm: {
        fontSize: fontSize.sm,
      } as TextStyle,
      lg: {
        fontSize: fontSize.lg,
      } as TextStyle,
      icon: {
        fontSize: fontSize.base,
      } as TextStyle,
    },
  }
);

export interface ButtonProps {
  children?: React.ReactNode;
  label?: string;
  onPress: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  className?: ViewStyle;
  style?: ViewStyle;
}

export function Button({
  children,
  label,
  onPress,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  className,
  style,
}: ButtonProps) {
  const buttonStyle = buttonVariants({ variant, size });
  const textStyle = textVariants({ variant, size });
  
  const iconColor = variant === 'outline' || variant === 'ghost' 
    ? colors.primary[600] 
    : colors.white;

  return (
    <TouchableOpacity
      style={cn(
        buttonStyle,
        {
          opacity: disabled || loading ? 0.6 : 1,
          width: style?.width || className?.width || 'auto',
        },
        className,
        style
      )}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={20}
              color={iconColor}
              style={{ marginRight: spacing.xs }}
            />
          )}
          {label && (
            <Text style={textStyle}>{label}</Text>
          )}
          {children && (
            <Text style={textStyle}>{children}</Text>
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={20}
              color={iconColor}
              style={{ marginLeft: spacing.xs }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

