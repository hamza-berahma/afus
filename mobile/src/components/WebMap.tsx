/**
 * Enhanced WebMap Component
 * 
 * Optimized Leaflet map for web with:
 * - Proper cleanup and memoization
 * - Performance optimizations
 * - Better error handling
 * - Smooth animations
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Cooperative } from '../types';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/spacing';

interface WebMapProps {
  cooperatives: Cooperative[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (cooperative: Cooperative) => void;
  height?: number;
}

export default function WebMap({ 
  cooperatives, 
  center, 
  onMarkerClick, 
  height = 400 
}: WebMapProps) {
  const mapContainerRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const [mapId] = useState(() => `map-${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter valid cooperatives
  const validCooperatives = useMemo(() => {
    return cooperatives.filter(
      (coop) => 
        coop.latitude && 
        coop.longitude &&
        typeof coop.latitude === 'number' &&
        typeof coop.longitude === 'number' &&
        !isNaN(coop.latitude) &&
        !isNaN(coop.longitude)
    );
  }, [cooperatives]);

  // Load Leaflet library
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
          
          // Wait for CSS to load
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Load Leaflet JS
        if (!leafletRef.current) {
          const leafletModule = await import('leaflet');
          leafletRef.current = leafletModule.default || leafletModule;
        }

        if (isMounted) {
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
        if (isMounted) {
          setError('Failed to load map library');
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize and update map
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !leafletRef.current || isLoading) {
      return;
    }

    const L = leafletRef.current;
    if (!L) return;

    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    let mapInstance: any = null;

    const initMap = () => {
      try {
        // Remove existing map if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Clear markers
        markersRef.current = [];

        // Default center (Morocco)
        const defaultCenter: [number, number] = center 
          ? [center.lat, center.lng]
          : validCooperatives.length > 0
            ? [validCooperatives[0].latitude!, validCooperatives[0].longitude!]
            : [31.7917, -7.0926];

        const defaultZoom = center ? 13 : validCooperatives.length === 1 ? 13 : 6;

        // Initialize map with optimized settings
        mapInstance = L.map(mapElement, {
          center: defaultCenter,
          zoom: defaultZoom,
          zoomControl: true,
          zoomControlOptions: {
            position: 'topright',
          },
          preferCanvas: true, // Better performance
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
        });

        // Add optimized tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors, © CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
          tileSize: 256,
          zoomOffset: 0,
        }).addTo(mapInstance);

        mapInstanceRef.current = mapInstance;

        // Add markers
        validCooperatives.forEach((coop) => {
          if (coop.latitude && coop.longitude) {
            // Create optimized custom icon
            const icon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: ${colors.primary[600]};
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  border: 3px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  cursor: pointer;
                  transition: transform 0.2s;
                ">
                  <span style="color: white; font-size: 18px;">🏪</span>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            });

            const marker = L.marker([coop.latitude, coop.longitude], { 
              icon,
              title: coop.name,
            })
              .addTo(mapInstance)
              .bindPopup(`
                <div style="padding: 12px; min-width: 180px; font-family: system-ui;">
                  <strong style="font-size: 15px; color: ${colors.gray[900]};">${coop.name}</strong><br/>
                  ${coop.region ? `<span style="font-size: 13px; color: ${colors.gray[600]};">${coop.region}</span><br/>` : ''}
                  ${coop.address ? `<span style="font-size: 12px; color: ${colors.gray[500]};">${coop.address}</span>` : ''}
                </div>
              `, {
                maxWidth: 250,
                className: 'custom-popup',
              });

            if (onMarkerClick) {
              marker.on('click', () => {
                onMarkerClick(coop);
              });
            }

            markersRef.current.push(marker);
          }
        });

        // Fit map to show all markers
        if (markersRef.current.length > 0) {
          if (markersRef.current.length === 1 && center) {
            mapInstance.setView([center.lat, center.lng], 13);
          } else if (markersRef.current.length > 1) {
            const group = L.featureGroup(markersRef.current);
            mapInstance.fitBounds(group.getBounds().pad(0.15), {
              maxZoom: 15,
              animate: true,
              duration: 0.5,
            });
          } else if (markersRef.current.length === 1) {
            const marker = markersRef.current[0];
            const latlng = marker.getLatLng();
            mapInstance.setView([latlng.lat, latlng.lng], 13, {
              animate: true,
              duration: 0.5,
            });
          }
        }

        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize();
          }
        }, 100);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initMap, 50);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup markers
      markersRef.current.forEach(marker => {
        if (mapInstance) {
          mapInstance.removeLayer(marker);
        }
      });
      markersRef.current = [];
    };
  }, [mapId, validCooperatives, center, onMarkerClick, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error('Error removing map:', err);
        }
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, []);

  if (Platform.OS !== 'web') {
    return <View style={[styles.container, { height }]} />;
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, { height }]}>
        <View style={styles.errorContent}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p style={{ marginTop: '8px', color: colors.error[500] }}>{error}</p>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]} ref={mapContainerRef}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <span style={{ fontSize: '24px' }}>🗺️</span>
          <p style={{ marginTop: '8px', color: colors.gray[600] }}>Loading map...</p>
        </View>
      )}
      {/* @ts-ignore - React Native Web allows this */}
      <div
        id={mapId}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${borderRadius.lg}px`,
          overflow: 'hidden',
          border: `1px solid ${colors.gray[200]}`,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.gray[50],
    position: 'relative',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
});
