import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { GeometricPattern } from '../components/GeometricPattern';
import EmptyState from '../components/EmptyState';

export default function CartScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadWalletBalance();
    }
  }, [user]);

  const loadWalletBalance = async () => {
    try {
      const response = await apiService.getWalletBalance();
      setWalletBalance(response.data.data?.balance || 0);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading wallet balance:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletBalance();
    setRefreshing(false);
  };

  const handleCheckout = async () => {
    if (!user) {
      showToast('Please login to checkout', 'error');
      navigation.navigate('Login' as never);
      return;
    }

    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    // Check if user has enough balance
    const total = getTotalPrice();
    const estimatedFee = total * 0.02; // 2% transaction fee
    const totalWithFee = total + estimatedFee;

    if (walletBalance !== null && walletBalance < totalWithFee) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${totalWithFee.toFixed(2)} MAD to complete this purchase. Your current balance is ${walletBalance.toFixed(2)} MAD.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Wallet',
            onPress: () => navigation.navigate('WalletTab' as never),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Checkout',
      `Total: ${totalWithFee.toFixed(2)} MAD (including fees)\n\nProceed with checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Checkout',
          style: 'default',
          onPress: () => processCheckout(),
        },
      ]
    );
  };

  const processCheckout = async () => {
    setCheckingOut(true);
    const transactions: string[] = [];
    const errors: string[] = [];

    try {
      // Process each item in cart
      for (const item of items) {
        try {
          // Simulate transaction to get fees
          const simulateResponse = await apiService.simulateTransaction({
            productId: item.product.id,
            quantity: item.quantity,
          });

          if (!simulateResponse.data.success) {
            throw new Error(simulateResponse.data.message || 'Simulation failed');
          }

          const simulatedFee = simulateResponse.data.data?.fee || 0;

          // Create transaction
          const createResponse = await apiService.createTransaction({
            productId: item.product.id,
            quantity: item.quantity,
            simulatedFee,
          });

          if (!createResponse.data.success) {
            throw new Error(createResponse.data.message || 'Transaction creation failed');
          }

          // Extract transaction ID from response
          // API returns: { success: true, data: { transactionId, ... } }
          const transactionId = createResponse.data.data?.transactionId;
          
          if (transactionId) {
            transactions.push(transactionId);
          } else {
            // If success but no ID, still count as success (transaction was created)
            if (createResponse.data.success) {
              transactions.push(`success-${Date.now()}-${item.product.id}`);
            } else {
              throw new Error(createResponse.data.message || 'Transaction creation failed');
            }
          }
        } catch (error: any) {
          console.error('Checkout error for item:', item.product.name, error);
          const errorMsg = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          error.message || 
                          'Failed to process item';
          errors.push(`${item.product.name}: ${errorMsg}`);
        }
      }

      // Handle results
      const successCount = transactions.length;
      
      if (successCount === 0 && errors.length > 0) {
        // All failed
        Alert.alert(
          'Checkout Failed',
          `Could not process any items:\n\n${errors.join('\n')}`,
          [{ text: 'OK' }]
        );
      } else if (errors.length > 0) {
        // Partial success
        Alert.alert(
          'Partial Success',
          `${successCount} transaction(s) created successfully.\n\nErrors:\n${errors.join('\n')}`,
          [
            { text: 'OK', onPress: () => {
              // Clear all items since some succeeded
              clearCart();
              setTimeout(() => {
                navigation.navigate('TransactionsTab' as never);
              }, 300);
            }}
          ]
        );
      } else {
        // All successful
        showToast(`Checkout successful! ${successCount} order(s) created`, 'success');
        clearCart();
        setTimeout(() => {
          navigation.navigate('TransactionsTab' as never);
        }, 500);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error?.message ||
                      error.message ||
                      'Checkout failed';
      showToast(errorMsg, 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const totalPrice = getTotalPrice();
  const estimatedFee = totalPrice * 0.02;
  const totalWithFee = totalPrice + estimatedFee;

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <GeometricPattern variant="hexagons" opacity={0.03} />
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add some products to get started"
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('ProductsTab' as never)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeometricPattern variant="hexagons" opacity={0.03} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {items.map((item) => {
            const images = item.product.imageUrls && item.product.imageUrls.length > 0
              ? item.product.imageUrls
              : (item.product.imageUrl ? [item.product.imageUrl] : []);
            const firstImage = images[0];

            return (
              <View key={item.product.id} style={styles.cartItem}>
                {/* Image */}
                <View style={styles.itemImageContainer}>
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="cube-outline" size={32} color={colors.gray[400]} />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  {item.product.cooperative && (
                    <Text style={styles.itemCoop} numberOfLines={1}>
                      {item.product.cooperative.name}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>
                    {item.product.price.toFixed(2)} MAD / {item.product.unit}
                  </Text>

                  {/* Quantity Controls */}
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={colors.gray[700]} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        if (item.quantity < item.product.stockQuantity) {
                          updateQuantity(item.product.id, item.quantity + 1);
                        } else {
                          showToast('Not enough stock available', 'error');
                        }
                      }}
                      disabled={item.quantity >= item.product.stockQuantity}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={item.quantity >= item.product.stockQuantity ? colors.gray[400] : colors.gray[700]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price and Remove */}
                <View style={styles.itemActions}>
                  <Text style={styles.itemTotal}>
                    {(item.product.price * item.quantity).toFixed(2)} MAD
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Item',
                        `Remove ${item.product.name} from cart?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeFromCart(item.product.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({getTotalItems()} items)</Text>
            <Text style={styles.summaryValue}>{totalPrice.toFixed(2)} MAD</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction Fee (2%)</Text>
            <Text style={styles.summaryValue}>{estimatedFee.toFixed(2)} MAD</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalWithFee.toFixed(2)} MAD</Text>
          </View>
          {walletBalance !== null && (
            <View style={styles.balanceInfo}>
              <Ionicons name="wallet-outline" size={16} color={colors.gray[600]} />
              <Text style={styles.balanceText}>
                Available: {walletBalance.toFixed(2)} MAD
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={checkingOut}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.checkoutButtonGradient}
          >
            {checkingOut ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.checkoutButtonText}>Checkout</Text>
                <Text style={styles.checkoutButtonSubtext}>
                  {totalWithFee.toFixed(2)} MAD
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  placeholder: {
    width: 40,
  },
  itemsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: spacing.md,
  },
  itemImageContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray[50],
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  itemCoop: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  quantityButton: {
    padding: spacing.xs,
  },
  quantityText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    minWidth: 30,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  summary: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  balanceText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  checkoutContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  checkoutButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  checkoutButtonSubtext: {
    fontSize: fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
});

