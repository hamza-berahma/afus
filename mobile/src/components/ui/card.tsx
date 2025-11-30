import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { cn } from '../../lib/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: ViewStyle;
  style?: ViewStyle;
  hoverable?: boolean;
}

export function Card({ children, className, style, hoverable }: CardProps) {
  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(hoverable && {
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
    ...className,
    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: ViewStyle;
  style?: ViewStyle;
}

export function CardHeader({ children, className, style }: CardHeaderProps) {
  return (
    <View style={cn({ padding: spacing.xl, paddingBottom: spacing.md }, className, style)}>
      {children}
    </View>
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: TextStyle;
  style?: TextStyle;
}

export function CardTitle({ children, className, style }: CardTitleProps) {
  return (
    <Text
      style={cn(
        {
          fontSize: 20,
          fontWeight: '600',
          color: colors.gray[900],
          marginBottom: spacing.xs,
        },
        className,
        style
      )}
    >
      {children}
    </Text>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: TextStyle;
  style?: TextStyle;
}

export function CardDescription({ children, className, style }: CardDescriptionProps) {
  return (
    <Text
      style={cn(
        {
          fontSize: 14,
          color: colors.gray[500],
        },
        className,
        style
      )}
    >
      {children}
    </Text>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: ViewStyle;
  style?: ViewStyle;
}

export function CardContent({ children, className, style }: CardContentProps) {
  return (
    <View style={cn({ padding: spacing.xl, paddingTop: 0 }, className, style)}>
      {children}
    </View>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: ViewStyle;
  style?: ViewStyle;
}

export function CardFooter({ children, className, style }: CardFooterProps) {
  return (
    <View style={cn({ padding: spacing.xl, paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center' }, className, style)}>
      {children}
    </View>
  );
}

