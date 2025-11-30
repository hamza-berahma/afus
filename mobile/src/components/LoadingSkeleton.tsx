import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius: br = 8, style }: SkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // useNativeDriver doesn't work on web
    const canUseNativeDriver = false;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: canUseNativeDriver,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: canUseNativeDriver,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: br,
          backgroundColor: colors.gray[200],
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const { width } = Dimensions.get('window');
  const NUM_COLUMNS = width > 600 ? 3 : 2;
  const CARD_WIDTH = (width - spacing.md * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
  const CARD_HEIGHT = CARD_WIDTH * 0.75;

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <Skeleton width="100%" height={CARD_HEIGHT} borderRadius={12} />
      <View style={styles.content}>
        <Skeleton width="70%" height={12} />
        <Skeleton width="80%" height={16} style={styles.marginTop} />
        <Skeleton width="60%" height={14} style={styles.marginTop} />
        <View style={styles.footer}>
          <Skeleton width={80} height={20} />
          <Skeleton width={50} height={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: spacing.md,
  },
  marginTop: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});

