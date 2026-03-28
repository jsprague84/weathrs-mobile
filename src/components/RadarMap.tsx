import { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/theme';
import { tileTracker } from '@/services/tileTracker';
import { RadarLegend, type RadarLayer } from './RadarLegend';

const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY ?? '';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
];

interface RadarMapProps {
  lat: number;
  lon: number;
  activeLayer: RadarLayer;
}

export function RadarMap({ lat, lon, activeLayer }: RadarMapProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const prevCoords = useRef({ lat, lon });

  // Count initial tile load on mount
  useEffect(() => {
    tileTracker.incrementOWM();
    tileTracker.incrementGoogleMaps();
  }, []);

  const handleRegionChange = useCallback(() => {
    tileTracker.incrementOWM();
    tileTracker.incrementGoogleMaps();
  }, []);

  // Animate to new coordinates when lat/lon props change (but not on initial mount)
  useEffect(() => {
    if (prevCoords.current.lat !== lat || prevCoords.current.lon !== lon) {
      prevCoords.current = { lat, lon };
      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 3,
          longitudeDelta: 3,
        },
        500,
      );
    }
  }, [lat, lon]);

  const tileUrl = `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 3,
          longitudeDelta: 3,
        }}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={12}
          tileSize={256}
          opacity={0.7}
          zIndex={1}
        />
      </MapView>

      <RadarLegend layer={activeLayer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
