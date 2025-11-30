import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CartBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartBottomSheet({ visible, onClose }: CartBottomSheetProps) {
  const navigation = useNavigation();
  const { items, getTotalPrice, getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleGoToCart = () => {
    onClose();
    navigation.navigate('Cart' as never);
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible && totalItems > 0}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.sheet}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="cart" size={24} color={colors.primary[600]} />
                <Text style={styles.headerText}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* Items Preview */}
            <ScrollView
              style={styles.itemsPreview}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {items.slice(0, 3).map((item) => (
                <View key={item.product.id} style={styles.previewItem}>
                  <View style={styles.previewItemInfo}>
                    <Text style={styles.previewItemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.previewItemDetails}>
                      {item.quantity} × {item.product.price.toFixed(2)} MAD
                    </Text>
                  </View>
                  <Text style={styles.previewItemPrice}>
                    {(item.product.price * item.quantity).toFixed(2)} MAD
                  </Text>
                </View>
              ))}
              {items.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
                </Text>
              )}
            </ScrollView>

            {/* Total and CTA */}
            <View style={styles.footer}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} MAD</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleGoToCart}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary[600], colors.primary[700]]}
                  style={styles.checkoutButtonGradient}
                >
                  <Text style={styles.checkoutButtonText}>Go to Cart</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: borderRadius.full,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  itemsPreview: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  previewItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  previewItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  previewItemDetails: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  previewItemPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  moreItemsText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  totalPrice: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  checkoutButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  checkoutButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

