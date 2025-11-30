import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api';
import { Product } from '../types';
import ProducerProductCard from '../components/ProducerProductCard';
import EmptyState from '../components/EmptyState';
import { GeometricPattern } from '../components/GeometricPattern';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_PADDING = 16; // spacing.md
const BUTTON_GAP = 16; // spacing.md
const BUTTON_WIDTH = (SCREEN_WIDTH - (BUTTON_PADDING * 2) - BUTTON_GAP) / 2;

export default function ProducerDashboardScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [creditScoreLoading, setCreditScoreLoading] = useState(true);
  const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadProducts();
    loadCreditScore();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiService.getDashboardStats();
      setStats(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadCreditScore = async () => {
    try {
      setCreditScoreLoading(true);
      const response = await apiService.getCreditScore();
      setCreditScore(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 403) {
        console.error('Error loading credit score:', error);
      }
    } finally {
      setCreditScoreLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiService.getProducts();
      setProducts(response.data.data?.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
    loadProducts();
    loadCreditScore();
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const productName = product?.name || 'this product';
    
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(productId),
        },
      ]
    );
  };

  const confirmDelete = async (productId: string) => {
    try {
      await apiService.deleteProduct(productId);
      showToast('Product deleted successfully', 'success');
      loadProducts();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete product', 'error');
      console.error('Error deleting product:', error);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProducerProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetail' as never, { id: item.id } as never)}
      onEdit={() => navigation.navigate('ProductForm' as never, { productId: item.id } as never)}
      onDelete={() => handleDeleteProduct(item.id)}
    />
  );

  if (loading && !stats) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeometricPattern variant="hexagons" opacity={0.03} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Manage your products & orders</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Buttons - 3 rows x 2 columns (always 2 per row) - EXACT same format and height */}
        <View style={styles.statsGrid}>
          {/* Row 1: Total Revenue */}
          <TouchableOpacity style={styles.statButton}>
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Total Revenue</Text>
                <Text style={styles.statButtonValue}>
                  {stats?.totalRevenue?.toFixed(2) || '0.00'} MAD
                </Text>
                {stats?.completedOrders !== undefined ? (
                  <Text style={styles.statButtonSubtext}>
                    {stats.completedOrders} completed orders
                  </Text>
                ) : (
                  <Text style={styles.statButtonSubtext}>From settled transactions</Text>
                )}
              </View>
              <Ionicons name="cash" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>

          {/* Row 1: Ma3qoul Score */}
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => setShowCreditScoreModal(true)}
          >
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Ma3qoul Score</Text>
                {creditScoreLoading ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} style={{ marginVertical: 8 }} />
                ) : (
                  <>
                    <Text style={styles.statButtonValue}>
                      {creditScore?.score || 'N/A'}
                    </Text>
                    <Text style={styles.statButtonSubtext}>
                      {creditScore?.tier || 'Building Trust'}
                    </Text>
                  </>
                )}
              </View>
              <Ionicons name="trophy" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>

          {/* Row 2: Add Product */}
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => navigation.navigate('ProductForm' as never, {} as never)}
          >
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Add Product</Text>
                <Text style={styles.statButtonValue}>New</Text>
                <Text style={styles.statButtonSubtext}>Create new listing</Text>
              </View>
              <Ionicons name="add-circle" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>

          {/* Row 2: Total Products */}
          <TouchableOpacity style={styles.statButton}>
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Total Products</Text>
                <Text style={styles.statButtonValue}>{stats?.activeProducts || products.length || 0}</Text>
                {stats?.lowStockProducts > 0 ? (
                  <Text style={styles.statButtonSubtext}>
                    {stats.lowStockProducts} low stock
                  </Text>
                ) : (
                  <Text style={styles.statButtonSubtext}>Active products</Text>
                )}
              </View>
              <Ionicons name="cube" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>

          {/* Row 3: Transactions */}
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => navigation.navigate('Transactions' as never)}
          >
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Transactions</Text>
                <Text style={styles.statButtonValue}>
                  {(stats?.completedOrders || 0) + (stats?.pendingOrders || 0)}
                </Text>
                <Text style={styles.statButtonSubtext}>View all transactions</Text>
              </View>
              <Ionicons name="arrow-forward" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>

          {/* Row 3: Pending Orders */}
          <TouchableOpacity style={styles.statButton}>
            <View style={styles.statButtonContent}>
              <View style={styles.statButtonLeft}>
                <Text style={styles.statButtonLabel}>Pending Orders</Text>
                <Text style={styles.statButtonValue}>{stats?.pendingOrders || 0}</Text>
                {stats?.completedOrders !== undefined ? (
                  <Text style={styles.statButtonSubtext}>
                    {stats.completedOrders} completed
                  </Text>
                ) : (
                  <Text style={styles.statButtonSubtext}>Awaiting completion</Text>
                )}
              </View>
              <Ionicons name="time" size={32} color={colors.success[500]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* My Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Products</Text>
            <Text style={styles.sectionSubtitle}>{products.length} products</Text>
          </View>

          {products.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              message="Start by adding your first product to begin selling"
              actionLabel="Add Product"
              onAction={() => navigation.navigate('ProductForm' as never, {} as never)}
            />
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.productsList}
            />
          )}
        </View>
      </ScrollView>

      {/* Ma3qoul Score Modal */}
      <Modal
        visible={showCreditScoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreditScoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ma3qoul Score Details</Text>
                <TouchableOpacity
                  onPress={() => setShowCreditScoreModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              {creditScoreLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={colors.primary[600]} />
                </View>
              ) : creditScore ? (
                <>
                  <View style={styles.modalScoreSection}>
                    <View style={styles.modalScoreContainer}>
                      <Ionicons name="trophy" size={48} color={colors.primary[600]} />
                      <Text style={styles.modalScoreValue}>{creditScore.score}</Text>
                      <View style={[styles.modalTierBadge, { backgroundColor: colors.primary[100] }]}>
                        <Text style={[styles.modalTierText, { color: colors.primary[800] }]}>
                          {creditScore.tier}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modalLoanAmount}>
                      Maximum Loan: <Text style={styles.modalLoanAmountValue}>
                        {creditScore.maxLoanAmount?.toFixed(2) || '0.00'} MAD
                      </Text>
                    </Text>
                  </View>

                  {creditScore.breakdown && (
                    <View style={styles.modalBreakdown}>
                      <Text style={styles.modalBreakdownTitle}>Score Breakdown</Text>
                      <View style={styles.modalBreakdownRow}>
                        <Text style={styles.modalBreakdownLabel}>Base Score</Text>
                        <Text style={styles.modalBreakdownValue}>+{creditScore.breakdown.baseScore}</Text>
                      </View>
                      <View style={styles.modalBreakdownRow}>
                        <Text style={styles.modalBreakdownLabel}>Volume Points</Text>
                        <Text style={[styles.modalBreakdownValue, { color: colors.success[600] }]}>
                          +{creditScore.breakdown.volumePoints}
                        </Text>
                      </View>
                      <View style={styles.modalBreakdownRow}>
                        <Text style={styles.modalBreakdownLabel}>Reliability Points</Text>
                        <Text style={[styles.modalBreakdownValue, { color: colors.success[600] }]}>
                          +{creditScore.breakdown.reliabilityPoints}
                        </Text>
                      </View>
                      <View style={styles.modalBreakdownRow}>
                        <Text style={styles.modalBreakdownLabel}>Stability Points</Text>
                        <Text style={[styles.modalBreakdownValue, { color: colors.success[600] }]}>
                          +{creditScore.breakdown.stabilityPoints}
                        </Text>
                      </View>
                      {creditScore.breakdown.penaltyPoints > 0 && (
                        <View style={styles.modalBreakdownRow}>
                          <Text style={styles.modalBreakdownLabel}>Penalty Points</Text>
                          <Text style={[styles.modalBreakdownValue, { color: colors.error }]}>
                            -{creditScore.breakdown.penaltyPoints}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {creditScore.nextMilestone && (
                    <View style={styles.modalMilestone}>
                      <Ionicons name="bulb" size={20} color={colors.primary[600]} />
                      <Text style={styles.modalMilestoneText}>{creditScore.nextMilestone}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.modalError}>
                  <Ionicons name="alert-circle" size={48} color={colors.gray[400]} />
                  <Text style={styles.modalErrorText}>Unable to load credit score information.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  statButton: {
    width: BUTTON_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 140,
  },
  statButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statButtonLeft: {
    flex: 1,
  },
  statButtonLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  statButtonValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  statButtonSubtext: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.md,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  productsList: {
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalScoreSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
  },
  modalScoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalScoreValue: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginVertical: spacing.sm,
  },
  modalTierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modalTierText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  modalLoanAmount: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  modalLoanAmountValue: {
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  modalBreakdown: {
    marginBottom: spacing.xl,
  },
  modalBreakdownTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  modalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  modalBreakdownLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  modalBreakdownValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  modalMilestone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  modalMilestoneText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
  modalError: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalErrorText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
});
