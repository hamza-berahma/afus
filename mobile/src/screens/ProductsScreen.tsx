import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { GeometricPattern } from '../components/GeometricPattern';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width } = Dimensions.get('window');
// Responsive breakpoints
const isPhone = width < 600;
const isTablet = width >= 600 && width < 900;
const NUM_COLUMNS = isPhone ? 2 : isTablet ? 3 : 4;
const gap = isPhone ? spacing.md : spacing.lg;
const CARD_WIDTH = (width - gap * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface Filters {
  region: string | null;
  cooperativeId: string | null;
  minPrice: string;
  maxPrice: string;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'name';
  inStock: boolean;
}

export default function ProductsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    region: null,
    cooperativeId: null,
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    inStock: false,
  });
  const [regions, setRegions] = useState<string[]>([]);
  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavoriteIds();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortProducts();
  }, [searchQuery, filters, products]);

  const loadFavoriteIds = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getFavoriteIds();
      const favoriteIds = response.data.data?.productIds || [];
      
      // Update products with favorite status
      setProducts(prevProducts => 
        prevProducts.map(p => ({
          ...p,
          isFavorite: favoriteIds.includes(p.id),
        }))
      );
    } catch (error) {
      console.error('Error loading favorite IDs:', error);
      // Silently fail - favorites are optional
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiService.getProducts({});
      const productsList = response.data.data?.products || [];
      
      // Load favorite status if user is logged in
      if (user) {
        try {
          const favResponse = await apiService.getFavoriteIds();
          const favoriteIds = favResponse.data.data?.productIds || [];
          productsList.forEach((p: Product) => {
            p.isFavorite = favoriteIds.includes(p.id);
          });
        } catch (error) {
          // Silently fail - favorites are optional
        }
      }
      
      setProducts(productsList);
      setFilteredProducts(productsList);

      // Extract unique regions and cooperatives
      const uniqueRegions = Array.from(
        new Set(
          productsList
            .map((p: Product) => p.cooperative?.region)
            .filter(Boolean) as string[]
        )
      );
      setRegions(uniqueRegions);

      const uniqueCooperatives = Array.from(
        new Map(
          productsList
            .map((p: Product) => p.cooperative)
            .filter(Boolean)
            .map((c: any) => [c.id, { id: c.id, name: c.name }])
        ).values()
      );
      setCooperatives(uniqueCooperatives);

      if (productsList.length === 0) {
        showToast('No products found', 'info');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.cooperative?.name.toLowerCase().includes(query)
      );
    }

    // Region filter
    if (filters.region) {
      filtered = filtered.filter(
        (p) => p.cooperative?.region === filters.region
      );
    }

    // Cooperative filter
    if (filters.cooperativeId) {
      filtered = filtered.filter(
        (p) => p.cooperative?.id === filters.cooperativeId
      );
    }

    // Price filters
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => p.price >= min);
      }
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => p.price <= max);
      }
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter((p) => (p.stockQuantity || 0) > 0);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const clearFilters = () => {
    setFilters({
      region: null,
      cooperativeId: null,
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      inStock: false,
    });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== null && v !== '' && v !== false && v !== 'newest'
  ).length + (searchQuery ? 1 : 0);

  const handleFavoriteChange = (productId: string, isFavorite: boolean) => {
    // Update products state
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, isFavorite } : p
      )
    );
    
    // Update filtered products state
    setFilteredProducts(prevFiltered =>
      prevFiltered.map(p =>
        p.id === productId ? { ...p, isFavorite } : p
      )
    );
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const isFirstInRow = index % NUM_COLUMNS === 0;
    return (
      <View style={[
        { width: CARD_WIDTH },
        !isFirstInRow && { marginLeft: gap }
      ]}>
        <ProductCard
          product={item}
          onPress={() => navigation.navigate('ProductDetail' as never, { id: item.id } as never)}
          onFavoriteChange={handleFavoriteChange}
          showAddToCart={true}
          cardWidth={CARD_WIDTH}
        />
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH, marginRight: gap, marginBottom: gap }]}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <GeometricPattern variant="zellij" opacity={0.05} />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Products</Text>
            <Text style={styles.subtitle}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </Text>
          </View>
          {user?.role === 'PRODUCER' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('ProductForm' as never, {} as never)}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options"
              size={20}
              color={activeFiltersCount > 0 ? colors.white : colors.primary[600]}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {loading && products.length === 0 ? (
          renderSkeleton()
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.list}
            columnWrapperStyle={NUM_COLUMNS > 1 ? styles.row : undefined}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon={searchQuery || activeFiltersCount > 0 ? 'search-outline' : 'cube-outline'}
                  title={searchQuery || activeFiltersCount > 0 ? 'No products found' : 'No products available'}
                  message={
                    searchQuery || activeFiltersCount > 0
                      ? 'Try adjusting your filters to find what you\'re looking for'
                      : 'No products are available at the moment. Check back later!'
                  }
                  actionLabel={searchQuery || activeFiltersCount > 0 ? 'Clear Filters' : undefined}
                  onAction={searchQuery || activeFiltersCount > 0 ? clearFilters : undefined}
                />
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Filters Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={24} color={colors.gray[700]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Sort By */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Sort By</Text>
                  <View style={styles.chipContainer}>
                    {(['newest', 'price-asc', 'price-desc', 'name'] as const).map((sort) => (
                      <TouchableOpacity
                        key={sort}
                        style={[
                          styles.chip,
                          filters.sortBy === sort && styles.chipActive,
                        ]}
                        onPress={() => setFilters({ ...filters, sortBy: sort })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.sortBy === sort && styles.chipTextActive,
                          ]}
                        >
                          {sort === 'newest' ? 'Newest' : sort === 'price-asc' ? 'Price: Low to High' : sort === 'price-desc' ? 'Price: High to Low' : 'Name'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Region */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Region</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        !filters.region && styles.chipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, region: null })}
                    >
                      <Text style={[styles.chipText, !filters.region && styles.chipTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {regions.map((region) => (
                      <TouchableOpacity
                        key={region}
                        style={[
                          styles.chip,
                          filters.region === region && styles.chipActive,
                        ]}
                        onPress={() => setFilters({ ...filters, region })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.region === region && styles.chipTextActive,
                          ]}
                        >
                          {region}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Cooperative */}
                {cooperatives.length > 0 && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Cooperative</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                      <TouchableOpacity
                        style={[
                          styles.chip,
                          !filters.cooperativeId && styles.chipActive,
                        ]}
                        onPress={() => setFilters({ ...filters, cooperativeId: null })}
                      >
                        <Text style={[styles.chipText, !filters.cooperativeId && styles.chipTextActive]}>
                          All
                        </Text>
                      </TouchableOpacity>
                      {cooperatives.map((coop) => (
                        <TouchableOpacity
                          key={coop.id}
                          style={[
                            styles.chip,
                            filters.cooperativeId === coop.id && styles.chipActive,
                          ]}
                          onPress={() => setFilters({ ...filters, cooperativeId: coop.id })}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              filters.cooperativeId === coop.id && styles.chipTextActive,
                            ]}
                          >
                            {coop.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Price Range (MAD)</Text>
                  <View style={styles.priceInputContainer}>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceLabel}>Min</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        value={filters.minPrice}
                        onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Text style={styles.priceSeparator}>-</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceLabel}>Max</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="∞"
                        value={filters.maxPrice}
                        onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* In Stock */}
                <View style={styles.filterSection}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.filterLabel}>In Stock Only</Text>
                    <Switch
                      value={filters.inStock}
                      onValueChange={(value) => setFilters({ ...filters, inStock: value })}
                      trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                      thumbColor={filters.inStock ? colors.primary[600] : colors.gray[400]}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accent[500],
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  list: {
    padding: gap,
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: gap,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  skeletonCard: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: spacing.xxl * 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  modalBody: {
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  chipTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  priceInput: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  priceSeparator: {
    fontSize: fontSize.xl,
    color: colors.gray[400],
    marginTop: spacing.lg,
    fontWeight: fontWeight.bold,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.md,
  },
  clearFiltersButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  clearFiltersText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  },
  applyButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
