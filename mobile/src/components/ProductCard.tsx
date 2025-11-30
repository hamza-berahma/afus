import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

// Helper function to calculate responsive dimensions
const getResponsiveDimensions = (cardWidth: number) => {
  const isPhoneSize = cardWidth < 200;
  const isTabletSize = cardWidth >= 200 && cardWidth < 300;
  
  return {
    isPhone: isPhoneSize,
    isTablet: isTabletSize,
    titleFontSize: isPhoneSize ? fontSize.base : isTabletSize ? fontSize.lg : fontSize.xl,
    descriptionFontSize: isPhoneSize ? fontSize.xs : fontSize.sm,
    priceFontSize: isPhoneSize ? fontSize.xl : fontSize['2xl'],
    favoriteButtonSize: isPhoneSize ? 36 : 40,
    favoriteIconSize: isPhoneSize ? 18 : 20,
    placeholderIconSize: isPhoneSize ? 40 : 48,
  };
};

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
  showAddToCart?: boolean;
  cardWidth?: number; // Optional width prop for responsive layout
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  onFavoriteChange, 
  showAddToCart = false,
  cardWidth: propCardWidth
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addToCart, getItemQuantity } = useCart();
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasStock = (product.stockQuantity || 0) > 0;
  const cartQuantity = getItemQuantity(product.id);

  // Calculate card width if not provided
  const { width: screenWidth } = Dimensions.get('window');
  const isPhone = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 900;
  
  const numColumns = isPhone ? 2 : isTablet ? 3 : 4;
  const gap = isPhone ? spacing.md : spacing.lg;
  const calculatedCardWidth = propCardWidth || (screenWidth - gap * (numColumns + 1)) / numColumns;
  const cardWidth = calculatedCardWidth;
  
  const responsive = getResponsiveDimensions(cardWidth);

  const handleFavoritePress = async (e: any) => {
    e.stopPropagation();
    
    if (!user) {
      showToast('Please login to add favorites', 'info');
      return;
    }

    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    const newFavoriteState = !isFavorite;

    try {
      if (newFavoriteState) {
        await apiService.addFavorite(product.id);
        showToast('Added to favorites', 'success');
      } else {
        await apiService.removeFavorite(product.id);
        showToast('Removed from favorites', 'success');
      }
      
      setIsFavorite(newFavoriteState);
      onFavoriteChange?.(product.id, newFavoriteState);
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      const errorMessage = error.response?.data?.message || 
        (newFavoriteState ? 'Failed to add favorite' : 'Failed to remove favorite');
      showToast(errorMessage, 'error');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addToCart(product, 1);
    showToast('Added to cart', 'success');
  };

  // Get first image: prefer imageUrls array, fallback to imageUrl
  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);
  const firstImage = images[0];
  const imageAspectRatio = 4 / 3; // 4:3 aspect ratio
  const imageHeight = cardWidth / imageAspectRatio;
  
  // Calculate max width for cooperative badge
  const coopBadgeMaxWidth = cardWidth * 0.6;

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: cardWidth }]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.95}
    >
      <Card style={styles.card} hoverable>
        {/* Image Header */}
        <CardHeader style={styles.cardHeader}>
          <View style={[styles.imageContainer, { height: imageHeight }]}>
            {firstImage && !imageError ? (
              <Image 
                source={{ uri: firstImage }} 
                style={styles.image} 
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary[100], colors.primary[50]]}
                style={styles.imagePlaceholder}
              >
                <Ionicons 
                  name="cube-outline" 
                  size={responsive.placeholderIconSize} 
                  color={colors.primary[400]} 
                />
              </LinearGradient>
            )}
            
            {/* Overlay Badges */}
            <View style={styles.overlayBadges}>
              {!hasStock && (
                <Badge 
                  label="Out of Stock" 
                  variant="destructive"
                  style={styles.outOfStockBadge}
                />
              )}
              {product.cooperative && (
                <Badge 
                  label={product.cooperative.name}
                  variant="secondary"
                  style={{ ...styles.coopBadge, maxWidth: coopBadgeMaxWidth }}
                />
              )}
            </View>

            {/* Favorite Button */}
            {user && (
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  { 
                    width: responsive.favoriteButtonSize, 
                    height: responsive.favoriteButtonSize 
                  },
                  isFavorite && styles.favoriteButtonActive
                ]}
                onPress={handleFavoritePress}
                disabled={isTogglingFavorite}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={responsive.favoriteIconSize} 
                  color={isFavorite ? colors.error[500] : colors.gray[600]} 
                />
              </TouchableOpacity>
            )}
          </View>
        </CardHeader>

        {/* Content */}
        <CardContent style={styles.cardContent}>
          {/* Product Name */}
          <Text style={[styles.name, { fontSize: responsive.titleFontSize }]} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Description */}
          {product.description && (
            <Text 
              style={[styles.description, { fontSize: responsive.descriptionFontSize }]} 
              numberOfLines={2}
            >
              {product.description}
            </Text>
          )}

          {/* Stock Badge */}
          {hasStock && (
            <View style={styles.stockContainer}>
              <Badge 
                label={`${product.stockQuantity} ${product.unit} available`}
                variant="success"
                style={styles.stockBadge}
              />
            </View>
          )}
        </CardContent>

        {/* Footer with Price and Actions */}
        <CardFooter style={styles.cardFooter}>
          <View style={styles.footerContent}>
            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { fontSize: responsive.priceFontSize }]}>
                {product.price.toFixed(2)}
              </Text>
              <Text style={[styles.currency, { fontSize: responsive.isPhone ? fontSize.sm : fontSize.base }]}> MAD</Text>
              <Text style={[styles.unit, { fontSize: responsive.isPhone ? fontSize.xs : fontSize.sm }]}>/{product.unit}</Text>
            </View>

            {/* Add to Cart Button */}
            {showAddToCart && hasStock && (
              <Button
                label={cartQuantity > 0 ? `${cartQuantity}` : 'Add'}
                onPress={() => handleAddToCart(null)}
                size="sm"
                icon={cartQuantity > 0 ? "checkmark" : "cart-outline"}
                iconPosition="right"
                style={{ ...styles.addToCartButton, minWidth: responsive.isPhone ? 80 : 100 }}
              />
            )}
          </View>
        </CardFooter>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Margin handled by parent FlatList
  },
  card: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    padding: 0,
    paddingBottom: 0,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.gray[50],
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBadges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    zIndex: 1,
  },
  outOfStockBadge: {
    shadowColor: colors.error[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coopBadge: {
    // maxWidth set dynamically
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  favoriteButtonActive: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  cardContent: {
    padding: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  name: {
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.gray[600],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  stockContainer: {
    marginTop: spacing.xs,
  },
  stockBadge: {
    alignSelf: 'flex-start',
  },
  cardFooter: {
    padding: spacing.md,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  price: {
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  currency: {
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: 2,
  },
  unit: {
    color: colors.gray[500],
    marginLeft: 4,
  },
  addToCartButton: {
    // minWidth set dynamically
  },
});

export default ProductCard;
