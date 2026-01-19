/**
 * Hook for accessing device location with permission handling
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

interface UseLocationReturn extends LocationState {
  requestLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  hasPermission: boolean;
}

export function useLocation(): UseLocationReturn {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  // Check initial permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setState((prev) => ({ ...prev, permissionStatus: status }));
      } catch (error) {
        // Permission check failed, will request on demand
      }
    };

    checkPermission();
  }, []);

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        const errorMsg = 'Location permission denied';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));

        // Show alert with option to open settings
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );

        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
        loading: false,
        error: null,
      }));

      return { latitude, longitude };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get location';
      setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
      return null;
    }
  }, []);

  const hasPermission = state.permissionStatus === 'granted';

  return {
    ...state,
    requestLocation,
    hasPermission,
  };
}

// Helper function to convert coordinates to a city query string
export function formatLocationQuery(latitude: number, longitude: number): string {
  // The weathrs API likely accepts lat,lon format or we can use reverse geocoding
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

// Reverse geocode to get city name
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (results.length > 0) {
      const { city, region, subregion } = results[0];
      // Return the most specific location name available
      return city || subregion || region || null;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}
