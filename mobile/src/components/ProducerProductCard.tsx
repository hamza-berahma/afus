import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
// Simple date formatter
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return '';
  }
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Card width accounts for section padding (spacing.md on each side)
const CARD_WIDTH = SCREEN_WIDTH - (spacing.md * 4);

interface ProducerProductCardProps {
  product: Product;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProducerProductCard: React.FC<ProducerProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
}) => {
  const hasStock = (product.stockQuantity || 0) > 0;
  const stockLevel = product.stockQuantity || 0;
  const isLowStock = stockLevel > 0 && stockLevel < 10;
  
  // Get first image
  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);
  const firstImage = images[0];
  
  // Format date
  const createdDate = product.createdAt 
    ? formatDate(product.createdAt)
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product.id)}
      activeOpacity={0.95}
    >
      {/* Main Card Content */}
      <View style={styles.cardContent}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[colors.primary[200], colors.primary[100]]}
              style={styles.imagePlaceholder}
            >
              <Ionicons name="cube-outline" size={48} color={colors.primary[400]} />
            </LinearGradient>
          )}
          
          {/* Stock Status Badge */}
          <View style={[
            styles.stockBadge,
            !hasStock && styles.stockBadgeOut,
            isLowStock && hasStock && styles.stockBadgeLow
          ]}>
            <Ionicons 
              name={hasStock ? (isLowStock ? "warning" : "checkmark-circle") : "close-circle"} 
              size={14} 
              color={colors.white} 
            />
            <Text style={styles.stockBadgeText}>
              {hasStock ? (isLowStock ? `Low: ${stockLevel}` : `In Stock: ${stockLevel}`) : 'Out of Stock'}
            </Text>
          </View>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              {product.cooperative && (
                <View style={styles.coopBadge}>
                  <Ionicons name="business" size={12} color={colors.primary[600]} />
                  <Text style={styles.coopText} numberOfLines={1}>
                    {product.cooperative.name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
          )}

          {/* Price and Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{product.price.toFixed(2)}</Text>
              <Text style={styles.currency}> MAD</Text>
              <Text style={styles.unit}>/{product.unit}</Text>
            </View>
            
            {createdDate && (
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={12} color={colors.gray[500]} />
                <Text style={styles.dateText}>{createdDate}</Text>
              </View>
            )}
          </View>

          {/* Stock Bar */}
          <View style={styles.stockBarContainer}>
            <View style={styles.stockBarBackground}>
              <View 
                style={[
                  styles.stockBarFill,
                  { 
                    width: `${Math.min((stockLevel / 100) * 100, 100)}%`,
                    backgroundColor: hasStock 
                      ? (isLowStock ? colors.warning[500] : colors.success[500])
                      : colors.error[500]
                  }
                ]} 
              />
            </View>
            <Text style={styles.stockText}>
              {stockLevel} {product.unit} available
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(product.id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary[50], colors.primary[100]]}
            style={styles.editButtonGradient}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary[700]} />
            <Text style={styles.editButtonText}>Edit</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(product.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.error[600], colors.error[700]]}
            style={styles.deleteButtonGradient}
          >
            <Ionicons name="trash-outline" size={18} color={colors.white} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardContent: {
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  imageSection: {
    width: 140,
    height: 180,
    position: 'relative',
    backgroundColor: colors.gray[50],
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
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  stockBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stockBadgeOut: {
    backgroundColor: colors.error[600],
  },
  stockBadgeLow: {
    backgroundColor: colors.warning[600],
  },
  stockBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  contentSection: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xs,
  },
  titleSection: {
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  coopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  coopText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
    marginBottom: spacing.sm,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  currency: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: 2,
  },
  unit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginLeft: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  stockBarContainer: {
    marginTop: spacing.xs,
  },
  stockBarBackground: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  stockText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  editButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: colors.error[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  deleteButtonText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});

export default ProducerProductCard;

