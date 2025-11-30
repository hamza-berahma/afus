/**
 * Enhanced Cooperatives Map Screen
 * 
 * Optimized map screen with:
 * - Better performance
 * - Search and filter
 * - Improved UX
 * - Responsive design
 * - Smooth animations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Cooperative } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import Map from '../components/Map';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const { width, height: screenHeight } = Dimensions.get('window');
const isTablet = width > 600;
const MAP_HEIGHT = isTablet ? 500 : screenHeight * 0.5;

export default function CooperativesMapScreen() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    loadCooperatives();
  }, []);

  const loadCooperatives = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCooperatives();
      const coops = response.data.data?.cooperatives || [];
      // Filter cooperatives that have GPS coordinates
      const coopsWithLocation = coops.filter(
        (coop: Cooperative) => coop.latitude && coop.longitude
      );
      setCooperatives(coopsWithLocation);
    } catch (error) {
      console.error('Error loading cooperatives:', error);
      showToast('Failed to load cooperatives', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter cooperatives based on search and region
  const filteredCooperatives = useMemo(() => {
    let filtered = cooperatives;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coop) =>
          coop.name.toLowerCase().includes(query) ||
          coop.region?.toLowerCase().includes(query) ||
          coop.address?.toLowerCase().includes(query)
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter((coop) => coop.region === selectedRegion);
    }

    return filtered;
  }, [cooperatives, searchQuery, selectedRegion]);

  // Get unique regions
  const regions = useMemo(() => {
    return Array.from(
      new Set(
        cooperatives
          .map((coop) => coop.region)
          .filter((region): region is string => Boolean(region))
      )
    ).sort();
  }, [cooperatives]);

  const handleMarkerPress = useCallback((cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedCooperative) {
      // @ts-ignore - Navigation typing issue
      navigation.navigate('CooperativeDetail', { id: selectedCooperative.id });
      setSelectedCooperative(null);
    }
  }, [selectedCooperative, navigation]);

  const handleGetDirections = useCallback(() => {
    if (!selectedCooperative || !selectedCooperative.latitude || !selectedCooperative.longitude) {
      return;
    }

    const { latitude, longitude } = selectedCooperative;
    let url = '';

    if (Platform.OS === 'ios') {
      url = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    } else if (Platform.OS === 'android') {
      url = `google.navigation:q=${latitude},${longitude}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(webUrl).catch(() => {
        showToast('Could not open map app', 'error');
      });
    });
  }, [selectedCooperative, showToast]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRegion(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <Card style={styles.headerCard}>
        <CardHeader>
          <CardTitle>Find Cooperatives</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, region, or address..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
            style={styles.searchInput}
          />
          
          {regions.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.regionFilter}
              contentContainerStyle={styles.regionFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.regionChip,
                  !selectedRegion && styles.regionChipActive,
                ]}
                onPress={() => setSelectedRegion(null)}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    !selectedRegion && styles.regionChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.regionChip,
                    selectedRegion === region && styles.regionChipActive,
                  ]}
                  onPress={() => setSelectedRegion(region)}
                >
                  <Text
                    style={[
                      styles.regionChipText,
                      selectedRegion === region && styles.regionChipTextActive,
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {(searchQuery || selectedRegion) && (
            <View style={styles.filterInfo}>
              <Badge 
                label={`${filteredCooperatives.length} found`}
                variant="secondary"
              />
              <Button
                label="Clear"
                onPress={clearFilters}
                variant="ghost"
                size="sm"
              />
            </View>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Map
          cooperatives={filteredCooperatives}
          onMarkerPress={handleMarkerPress}
          height={MAP_HEIGHT}
          fitToMarkers={true}
          showUserLocation={true}
        />
      </View>

      {/* Selected Cooperative Info Card */}
      {selectedCooperative && (
        <Card style={styles.infoCard}>
          <CardHeader>
            <View style={styles.infoHeader}>
              <Ionicons name="business" size={24} color={colors.primary[600]} />
              <CardTitle style={styles.infoTitle}>{selectedCooperative.name}</CardTitle>
              <TouchableOpacity
                onPress={() => setSelectedCooperative(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            {selectedCooperative.region && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{selectedCooperative.region}</Text>
              </View>
            )}
            {selectedCooperative.address && (
              <View style={styles.infoRow}>
                <Ionicons name="map-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.infoText} numberOfLines={2}>
                  {selectedCooperative.address}
                </Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <Button
                label="Directions"
                onPress={handleGetDirections}
                icon="navigate-outline"
                iconPosition="left"
                variant="outline"
                size="sm"
                style={styles.actionButton}
              />
              <Button
                label="Details"
                onPress={handleViewDetails}
                icon="chevron-forward"
                iconPosition="right"
                size="sm"
                style={styles.actionButton}
              />
            </View>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredCooperatives.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={colors.gray[400]} />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedRegion ? 'No cooperatives found' : 'No cooperatives with location data'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedRegion
              ? 'Try adjusting your search or filters'
              : 'Cooperatives need GPS coordinates to appear on the map'}
          </Text>
          {(searchQuery || selectedRegion) && (
            <Button
              label="Clear Filters"
              onPress={clearFilters}
              variant="outline"
              style={styles.emptyButton}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  headerCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  regionFilter: {
    marginBottom: spacing.sm,
  },
  regionFilterContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  regionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  regionChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  regionChipText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  regionChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  mapContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    maxHeight: screenHeight * 0.4,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    flex: 1,
    marginLeft: spacing.sm,
    marginBottom: 0,
  },
  closeButton: {
    padding: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    position: 'absolute',
    top: '50%',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -100 }],
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
});
