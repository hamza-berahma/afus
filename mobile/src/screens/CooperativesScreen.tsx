import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GeometricPattern } from '../components/GeometricPattern';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width } = Dimensions.get('window');

import { Cooperative } from '../types';

export default function CooperativesScreen() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCooperatives();
  }, []);

  const loadCooperatives = async () => {
    try {
      const response = await apiService.getCooperatives();
      setCooperatives(response.data.data?.cooperatives || []);
    } catch (error) {
      console.error('Error loading cooperatives:', error);
      showToast('Failed to load cooperatives', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCooperatives();
  };

  const renderCooperative = ({ item }: { item: Cooperative }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CooperativeDetail' as never, { id: item.id } as never)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            style={styles.imagePlaceholder}
          >
            <Ionicons name="business" size={48} color={colors.white} />
          </LinearGradient>
        )}
        <View style={styles.overlay}>
          <View style={styles.productCountBadge}>
            <Ionicons name="cube" size={14} color={colors.white} />
            <Text style={styles.productCountText}>{item.productCount || 0} products</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.region && (
          <View style={styles.regionContainer}>
            <Ionicons name="location" size={14} color={colors.gray[500]} />
            <Text style={styles.region}>{item.region}</Text>
          </View>
        )}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('CooperativeDetail' as never, { id: item.id } as never)}
        >
          <Text style={styles.viewButtonText}>View Store</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeometricPattern variant="hexagons" opacity={0.03} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cooperatives</Text>
            <Text style={styles.subtitle}>
              {cooperatives.length} {cooperatives.length === 1 ? 'store' : 'stores'} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('CooperativesMap' as never)}
          >
            <Ionicons name="map-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cooperatives}
          renderItem={renderCooperative}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No cooperatives found"
              message="No cooperatives are available at the moment"
            />
          }
          showsVerticalScrollIndicator={false}
        />
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  mapButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
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
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
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
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  productCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[600] + 'E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  productCountText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 4,
  },
  region: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    gap: spacing.xs,
  },
  viewButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
});

