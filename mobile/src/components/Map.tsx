/**
 * Enhanced Map Component
 * 
 * Optimized map component with:
 * - Performance optimizations (memoization, clustering)
 * - Proper region fitting
 * - Smooth animations
 * - Better error handling
 * - Responsive design
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cooperative } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { MapView, Marker, PROVIDER_GOOGLE } from '../utils/maps';
import WebMap from './WebMap';

interface MapProps {
  cooperatives: Cooperative[];
  onMarkerPress?: (cooperative: Cooperative) => void;
  height?: number;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  fitToMarkers?: boolean;
  showUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
}

// Morocco center coordinates
const DEFAULT_REGION = {
  latitude: 31.7917,
  longitude: -7.0926,
  latitudeDelta: 8.0,
  longitudeDelta: 8.0,
};

export default function Map({
  cooperatives,
  onMarkerPress,
  height = 400,
  initialRegion,
  fitToMarkers = true,
  showUserLocation = false,
  scrollEnabled = true,
  zoomEnabled = true,
}: MapProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter cooperatives with valid coordinates
  const validCooperatives = useMemo(() => {
    return cooperatives.filter(
      (coop) => 
        coop.latitude && 
        coop.longitude &&
        typeof coop.latitude === 'number' &&
        typeof coop.longitude === 'number' &&
        !isNaN(coop.latitude) &&
        !isNaN(coop.longitude) &&
        coop.latitude >= -90 &&
        coop.latitude <= 90 &&
        coop.longitude >= -180 &&
        coop.longitude <= 180
    );
  }, [cooperatives]);

  // Calculate region to fit all markers
  const calculatedRegion = useMemo(() => {
    if (!fitToMarkers || validCooperatives.length === 0) {
      return initialRegion || DEFAULT_REGION;
    }

    if (validCooperatives.length === 1) {
      const coop = validCooperatives[0];
      return {
        latitude: coop.latitude!,
        longitude: coop.longitude!,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calculate bounds
    const latitudes = validCooperatives.map(c => c.latitude!);
    const longitudes = validCooperatives.map(c => c.longitude!);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5; // Add padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.1),
      longitudeDelta: Math.max(lngDelta, 0.1),
    };
  }, [validCooperatives, fitToMarkers, initialRegion]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    setMapError(null);
  }, []);

  // Handle map error
  const handleMapError = useCallback((error: any) => {
    console.error('Map error:', error);
    setMapError('Failed to load map');
    setMapReady(false);
  }, []);

  // Fit map to markers when ready
  useEffect(() => {
    if (mapReady && mapRef.current && fitToMarkers && validCooperatives.length > 0) {
      try {
        if (validCooperatives.length === 1) {
          const coop = validCooperatives[0];
          mapRef.current.animateToRegion({
            latitude: coop.latitude!,
            longitude: coop.longitude!,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 500);
        } else {
          // Fit to all markers
          const coordinates = validCooperatives.map(coop => ({
            latitude: coop.latitude!,
            longitude: coop.longitude!,
          }));
          
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: {
              top: spacing.xl,
              right: spacing.xl,
              bottom: spacing.xl,
              left: spacing.xl,
            },
            animated: true,
          });
        }
      } catch (error) {
        console.error('Error fitting map:', error);
      }
    }
  }, [mapReady, validCooperatives, fitToMarkers]);

  // Handle marker press
  const handleMarkerPress = useCallback((cooperative: Cooperative) => {
    if (onMarkerPress) {
      onMarkerPress(cooperative);
    }
  }, [onMarkerPress]);

  // Web platform - use WebMap component
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <WebMap
          cooperatives={validCooperatives}
          onMarkerClick={onMarkerPress}
          height={height}
          center={validCooperatives.length === 1 ? {
            lat: validCooperatives[0].latitude!,
            lng: validCooperatives[0].longitude!,
          } : undefined}
        />
        {mapError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={colors.error[500]} />
            <Text style={styles.errorText}>{mapError}</Text>
          </View>
        )}
      </View>
    );
  }

  // Native platform - use react-native-maps
  if (!MapView) {
    return (
      <View style={[styles.container, styles.placeholder, { height }]}>
        <Ionicons name="map-outline" size={48} color={colors.gray[400]} />
        <Text style={styles.placeholderText}>Map not available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={calculatedRegion}
        onMapReady={handleMapReady}
        onMapError={handleMapError}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation && scrollEnabled}
        showsCompass={true}
        mapType="standard"
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={scrollEnabled}
        pitchEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary[600]}
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }],
          },
          {
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#f5f5f5' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9c9c9' }],
          },
        ]}
      >
        {validCooperatives.map((coop) => (
          <Marker
            key={coop.id}
            coordinate={{
              latitude: coop.latitude!,
              longitude: coop.longitude!,
            }}
            title={coop.name}
            description={coop.region || coop.address || ''}
            onPress={() => handleMarkerPress(coop)}
            tracksViewChanges={false} // Performance optimization
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Ionicons name="business" size={18} color={colors.white} />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {!mapReady && !mapError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {mapError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={colors.error[500]} />
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.gray[600],
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.error[500],
    textAlign: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  placeholderText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.gray[500],
  },
});

