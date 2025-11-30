import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import CartBottomSheet from './CartBottomSheet';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

export default function FloatingCartButton() {
  const navigation = useNavigation();
  const { getTotalItems, getTotalPrice } = useCart();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (totalItems > 0) {
      // Animate when items are added
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [totalItems]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowBottomSheet(true)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.gradient}
          >
            <Ionicons name="cart" size={24} color={colors.white} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
        <View style={styles.info}>
          <Text style={styles.infoText}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
          <Text style={styles.infoPrice}>{totalPrice.toFixed(2)} MAD</Text>
        </View>
      </TouchableOpacity>

      <CartBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.gray[100],
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error[600],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  infoPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
});

