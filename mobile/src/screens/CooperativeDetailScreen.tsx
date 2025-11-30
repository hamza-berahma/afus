import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
  Platform,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Product, Cooperative } from '../types';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { GeometricPattern } from '../components/GeometricPattern';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

// Import maps utilities (handles platform-specific loading)
import Map from '../components/Map';

const { width } = Dimensions.get('window');
const isTablet = width > 600;
const NUM_COLUMNS = isTablet ? 3 : 2;
const CARD_WIDTH = (width - spacing.md * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function CooperativeDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { id } = route.params as { id: string };
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{
    totalProducts?: number;
    totalTransactions?: number;
    rating?: number;
    customerCount?: number;
    successfulTransactions?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coopResponse, productsResponse] = await Promise.all([
        apiService.getCooperative(id),
        apiService.getCooperativeProducts(id, { limit: 50 }),
      ]);
      
      // Handle cooperative response structure
      // API returns: { success: true, data: { cooperative: {...}, stats: {...}, ... } }
      let coopData: Cooperative | null = null;
      let responseStats = null;
      
      // Try different response structures
      if (coopResponse.data?.success && coopResponse.data?.data) {
        coopData = coopResponse.data.data.cooperative || null;
        responseStats = coopResponse.data.data.stats || null;
      } else if (coopResponse.data?.data) {
        coopData = coopResponse.data.data.cooperative || null;
        responseStats = coopResponse.data.data.stats || null;
      } else if (coopResponse.data?.cooperative) {
        coopData = coopResponse.data.cooperative;
        responseStats = coopResponse.data.stats || null;
      } else if (coopResponse.data && typeof coopResponse.data === 'object') {
        // Check if it's a cooperative object directly
        if ('name' in coopResponse.data && 'id' in coopResponse.data) {
          coopData = coopResponse.data as Cooperative;
        } else if ('cooperative' in coopResponse.data) {
          coopData = coopResponse.data.cooperative;
          responseStats = coopResponse.data.stats || null;
        }
      }
      
      if (!coopData || !coopData.id) {
        console.error('Invalid cooperative data:', coopResponse.data);
        throw new Error('Cooperative data not found or invalid');
      }
      
      setCooperative(coopData);
      setStats(responseStats);
      
      // Handle products response structure
      // API returns: { success: true, data: { products: [...], pagination: {...} } }
      let productsList: Product[] = [];
      
      if (productsResponse.data?.success && productsResponse.data?.data) {
        if (Array.isArray(productsResponse.data.data.products)) {
          productsList = productsResponse.data.data.products;
        } else if (Array.isArray(productsResponse.data.data)) {
          productsList = productsResponse.data.data;
        }
      } else if (productsResponse.data?.data) {
        if (Array.isArray(productsResponse.data.data.products)) {
          productsList = productsResponse.data.data.products;
        } else if (Array.isArray(productsResponse.data.data)) {
          productsList = productsResponse.data.data;
        }
      } else if (Array.isArray(productsResponse.data?.products)) {
        productsList = productsResponse.data.products;
      } else if (Array.isArray(productsResponse.data)) {
        productsList = productsResponse.data;
      }
      
      setProducts(productsList);
    } catch (error: any) {
      console.error('Error loading cooperative:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load cooperative';
      showToast(errorMessage, 'error');
      setCooperative(null);
      setStats(null);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View
      style={[
        styles.cardWrapper,
        { width: CARD_WIDTH },
        index % NUM_COLUMNS === 0 && styles.cardWrapperFirst,
      ]}
    >
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail' as never, { id: item.id } as never)}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading cooperative...</Text>
      </View>
    );
  }

  if (!cooperative) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="business-outline"
          title="Cooperative not found"
          message="This cooperative doesn't exist or could not be loaded"
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
          {cooperative.imageUrl ? (
            <Image source={{ uri: cooperative.imageUrl }} style={styles.headerImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              style={styles.headerImage}
            >
              <Ionicons name="business" size={64} color={colors.white} />
            </LinearGradient>
          )}
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <Text style={styles.storeName}>{cooperative.name}</Text>
              {cooperative.region && (
                <View style={styles.regionContainer}>
                  <Ionicons name="location" size={16} color={colors.white} />
                  <Text style={styles.region}>{cooperative.region}</Text>
                </View>
              )}
              {cooperative.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {cooperative.description}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={24} color={colors.primary[600]} />
            <Text style={styles.statValue}>{stats?.totalProducts ?? products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={colors.accent[500]} />
            <Text style={styles.statValue}>
              {stats?.rating ? stats.rating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={colors.secondary[500]} />
            <Text style={styles.statValue}>
              {stats?.customerCount ? `${stats.customerCount}+` : '0'}
            </Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Location Map */}
        {cooperative.latitude && cooperative.longitude && (
          <View style={styles.mapSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="map" size={20} color={colors.gray[900]} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              {cooperative.address && (
                <Text style={styles.sectionSubtitle} numberOfLines={1}>
                  {cooperative.address}
                </Text>
              )}
            </View>
            <View style={styles.mapContainer}>
              {cooperative.latitude && cooperative.longitude ? (
                <Map
                  cooperatives={[cooperative]}
                  height={isTablet ? 250 : 200}
                  initialRegion={{
                    latitude: cooperative.latitude,
                    longitude: cooperative.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  fitToMarkers={true}
                  scrollEnabled={false}
                  zoomEnabled={false}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={32} color={colors.gray[400]} />
                  <Text style={styles.mapPlaceholderText}>
                    Location not available
                  </Text>
                </View>
              )}
              {cooperative.latitude && cooperative.longitude && (
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => {
                    const { latitude, longitude } = cooperative;
                    let url = '';
                    if (Platform.OS === 'ios') {
                      url = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
                    } else if (Platform.OS === 'android') {
                      url = `google.navigation:q=${latitude},${longitude}`;
                    } else {
                      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                    }
                    Linking.openURL(url).catch((err) => {
                      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                      Linking.openURL(webUrl).catch(() => {
                        showToast('Could not open map app', 'error');
                      });
                    });
                  }}
                >
                  <Ionicons name="navigate" size={14} color={colors.white} />
                  <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
            <Text style={styles.sectionSubtitle}>{products.length} items</Text>
          </View>

          {products.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              message="This cooperative hasn't added any products yet"
            />
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              contentContainerStyle={styles.productsList}
              columnWrapperStyle={NUM_COLUMNS > 1 ? styles.row : undefined}
            />
          )}
        </View>
      </ScrollView>
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
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.lg,
  },
  headerContent: {
    gap: spacing.sm,
  },
  storeName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  region: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    marginTop: 2,
  },
  productsSection: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  productsList: {
    paddingTop: spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  cardWrapperFirst: {
    marginRight: 0,
  },
  mapSection: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[200],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapContainer: {
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: colors.primary[600],
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  directionsButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[600],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  directionsButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  mapPlaceholderAddress: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  mapPlaceholderCoords: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
});

