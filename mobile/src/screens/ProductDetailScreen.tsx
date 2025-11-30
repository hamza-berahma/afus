import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui';
import ProductCard from '../components/ProductCard';
import { GeometricPattern } from '../components/GeometricPattern';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 3) / 2;

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addToCart, getItemQuantity } = useCart();
  const { id } = route.params as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [sameCoopProducts, setSameCoopProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
      // Reset image index when product changes
      const images = product.imageUrls && product.imageUrls.length > 0 
        ? product.imageUrls 
        : (product.imageUrl ? [product.imageUrl] : []);
      if (images.length > 0 && selectedImageIndex >= images.length) {
        setSelectedImageIndex(0);
      } else if (images.length === 0) {
        setSelectedImageIndex(0);
      }
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      const response = await apiService.getProduct(id);
      setProduct(response.data.data?.product || response.data.product);
    } catch (error) {
      showToast('Failed to load product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      // Get products from same cooperative
      if (product?.cooperative?.id) {
        const coopResponse = await apiService.getCooperativeProducts(product.cooperative.id, { limit: 6 });
        const coopProducts = coopResponse.data.data?.products || [];
        setSameCoopProducts(
          coopProducts.filter((p: Product) => p.id !== product.id).slice(0, 4)
        );
      }

      // Get recommended products (similar price range or category)
      const allProductsResponse = await apiService.getProducts({ limit: 20 });
      const allProducts = allProductsResponse.data.data?.products || [];
      const recommended = allProducts
        .filter((p: Product) => 
          p.id !== product?.id && 
          p.cooperative?.id !== product?.cooperative?.id &&
          Math.abs(p.price - (product?.price || 0)) < (product?.price || 0) * 0.5
        )
        .slice(0, 4);
      setRecommendedProducts(recommended);
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      showToast('Please login to purchase products', 'error');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    if (qty > (product?.stockQuantity || 0)) {
      showToast('Insufficient stock available', 'error');
      return;
    }

    // Show security confirmation modal
    setShowPurchaseConfirmation(true);
  };

  const handleConfirmPurchase = async () => {
    if (!product) return;

    const qty = parseInt(quantity);
    setPurchasing(true);
    try {
      const simulateResponse = await apiService.simulateTransaction({
        productId: id,
        quantity: qty,
      });

      const { totalCost, fee } = simulateResponse.data.data;

      await apiService.createTransaction({
        productId: id,
        quantity: qty,
        simulatedFee: fee,
      });
      showToast('Order placed successfully!', 'success');
      setShowPurchaseConfirmation(false);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Purchase failed', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('ProductForm' as never, { productId: id } as never);
  };

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isOwner = user?.role === 'PRODUCER' && product.cooperative?.id;
  
  // Get images: prefer imageUrls array, fallback to imageUrl
  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);
  
  // Ensure selectedImageIndex is within bounds
  const safeImageIndex = images.length > 0 
    ? Math.min(selectedImageIndex, images.length - 1) 
    : 0;
  
  const mainImage = images.length > 0 && images[safeImageIndex] ? images[safeImageIndex] : null;

  return (
    <View style={styles.container}>
      <GeometricPattern variant="zellij" opacity={0.03} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Section - Amazon Style */}
        <View style={styles.imageSection}>
          {mainImage ? (
            <>
              <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
              {/* Image Navigation (if multiple images) */}
              {images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={styles.imageNavButton}
                    onPress={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  >
                    <Ionicons name="chevron-back" size={24} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.imageNavButtonRight]}
                    onPress={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  >
                    <Ionicons name="chevron-forward" size={24} color={colors.white} />
                  </TouchableOpacity>
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {safeImageIndex + 1} / {images.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <LinearGradient
              colors={[colors.primary[100], colors.primary[50]]}
              style={styles.placeholderImage}
            >
              <Ionicons name="cube-outline" size={64} color={colors.primary[400]} />
            </LinearGradient>
          )}
        </View>
        
        {/* Thumbnail Gallery (if multiple images) */}
        {images.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailGallery}
            contentContainerStyle={styles.thumbnailGalleryContent}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnail,
                  safeImageIndex === index && styles.thumbnailSelected,
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.name}>{product.name}</Text>
              {product.cooperative && (
                <TouchableOpacity
                  style={styles.coopCard}
                  onPress={() => navigation.navigate('CooperativeDetail' as never, { id: product.cooperative!.id } as never)}
                >
                  <View style={styles.coopBadge}>
                    <Ionicons name="business" size={16} color={colors.primary[600]} />
                    <Text style={styles.coopName}>{product.cooperative.name}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
            {isOwner && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{product.price.toFixed(2)}</Text>
              <Text style={styles.currency}> MAD</Text>
              <Text style={styles.unit}>/ {product.unit}</Text>
            </View>
            <View style={styles.stockBadge}>
              <Ionicons name="cube" size={16} color={colors.primary[600]} />
              <Text style={styles.stockText}>
                {product.stockQuantity} {product.unit} available
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Purchase Section (Buyers only) */}
          {user?.role === 'BUYER' && (
            <View style={styles.purchaseSection}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <View style={styles.quantityInputContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = Math.max(1, parseInt(quantity) - 1);
                      setQuantity(qty.toString());
                    }}
                  >
                    <Ionicons name="remove" size={20} color={colors.gray[700]} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = Math.min(
                        product.stockQuantity,
                        parseInt(quantity) + 1
                      );
                      setQuantity(qty.toString());
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.gray[700]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>
                  {(product.price * parseInt(quantity) || 0).toFixed(2)} MAD
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => {
                    const qty = parseInt(quantity) || 1;
                    if (qty > product.stockQuantity) {
                      showToast('Not enough stock available', 'error');
                      return;
                    }
                    addToCart(product, qty);
                    showToast(`Added ${qty} to cart`, 'success');
                  }}
                  disabled={parseInt(quantity) > product.stockQuantity || parseInt(quantity) <= 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cart-outline" size={20} color={colors.primary[600]} />
                  <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  {getItemQuantity(product.id) > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{getItemQuantity(product.id)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.buyNowButton}
                  onPress={handlePurchase}
                  disabled={purchasing || parseInt(quantity) > product.stockQuantity || parseInt(quantity) <= 0}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary[600], colors.primary[700]]}
                    style={styles.buyNowButtonGradient}
                  >
                    {purchasing ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Text style={styles.buyNowButtonText}>Buy Now</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.white} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Products from Same Cooperative */}
          {sameCoopProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>More from {product.cooperative?.name}</Text>
                  <Text style={styles.sectionSubtitle}>Explore other products from this store</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CooperativeDetail' as never, { id: product.cooperative!.id } as never)}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {sameCoopProducts.map((item) => (
                  <View key={item.id} style={[styles.relatedCard, { width: CARD_WIDTH }]}>
                    <ProductCard
                      product={item}
                      onPress={() => {
                        navigation.replace('ProductDetail' as never, { id: item.id } as never);
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>You May Also Like</Text>
                  <Text style={styles.sectionSubtitle}>Recommended for you</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {recommendedProducts.map((item) => (
                  <View key={item.id} style={[styles.relatedCard, { width: CARD_WIDTH }]}>
                    <ProductCard
                      product={item}
                      onPress={() => {
                        navigation.replace('ProductDetail' as never, { id: item.id } as never);
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purchase Confirmation Modal */}
      {product && (
        <TransactionConfirmationModal
          visible={showPurchaseConfirmation}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowPurchaseConfirmation(false)}
          transactionType="purchase"
          amount={(product.price * parseInt(quantity)) + ((product.price * parseInt(quantity)) * 0.02)}
          details={`${quantity} x ${product.name} @ ${product.price} MAD/${product.unit}`}
          title="Confirm Purchase"
          description={`Total: ${((product.price * parseInt(quantity)) + ((product.price * parseInt(quantity)) * 0.02)).toFixed(2)} MAD (including fees)`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  imageSection: {
    width: '100%',
    height: 350,
    backgroundColor: colors.gray[50],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavButton: {
    position: 'absolute',
    left: spacing.md,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavButtonRight: {
    left: 'auto',
    right: spacing.md,
  },
  imageCounter: {
    position: 'absolute',
    bottom: spacing.md,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  imageCounterText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  thumbnailGallery: {
    maxHeight: 100,
    marginBottom: spacing.md,
  },
  thumbnailGalleryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  thumbnailSelected: {
    borderColor: colors.primary[600],
    borderWidth: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleSection: {
    flex: 1,
  },
  name: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  coopCard: {
    marginTop: spacing.xs,
  },
  coopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  coopName: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  editButton: {
    padding: spacing.sm,
  },
  priceSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  currency: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  unit: {
    fontSize: fontSize.lg,
    color: colors.gray[500],
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  stockText: {
    fontSize: fontSize.sm,
    color: colors.success[700],
    fontWeight: fontWeight.medium,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    lineHeight: 24,
  },
  purchaseSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
  },
  quantityContainer: {
    marginBottom: spacing.md,
  },
  quantityLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  quantityButton: {
    padding: spacing.md,
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    paddingVertical: spacing.sm,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  },
  totalAmount: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  buyButton: {
    marginTop: spacing.sm,
  },
  relatedSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  viewAllText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  horizontalScroll: {
    paddingRight: spacing.md,
  },
  relatedCard: {
    marginRight: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
});
