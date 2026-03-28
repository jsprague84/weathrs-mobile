import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useCityToQuery } from '@/hooks/useCityToQuery';
import { useLocation } from '@/hooks/useLocation';
import { resolveCoordinates } from '@/services/location';
import { RadarMap } from '@/components/RadarMap';
import { RadarLayerPicker } from '@/components/RadarLayerPicker';
import { RadarPlayback } from '@/components/RadarPlayback';
import type { RadarLayer } from '@/components/RadarLegend';

export default function RadarScreen() {
  const { colors } = useTheme();
  const { cityDisplayName, lat, lon } = useCityToQuery({ withDisplay: true });
  const { requestLocation } = useLocation();

  const [activeLayer, setActiveLayer] = useState<RadarLayer>('precipitation_new');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);

  // Use map center override or fall back to selected city
  const displayLat = mapCenter?.lat ?? lat ?? 39.83;
  const displayLon = mapCenter?.lon ?? lon ?? -98.58;

  const handleMyLocation = useCallback(async () => {
    const coords = await requestLocation();
    if (coords) {
      try {
        const location = await resolveCoordinates(coords.latitude, coords.longitude);
        setMapCenter({ lat: location.lat, lon: location.lon });
      } catch {
        // Fall back to raw GPS coordinates
        setMapCenter({ lat: coords.latitude, lon: coords.longitude });
      }
    }
  }, [requestLocation]);

  const currentTimestamp = Math.floor(Date.now() / 1000);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cityName, { color: colors.text }]}>
          {cityDisplayName || 'Select a city'}
        </Text>
        <Pressable
          onPress={handleMyLocation}
          style={[styles.locationButton, { backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Center map on my location"
        >
          <Ionicons name="locate" size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.primary }]}>My Location</Text>
        </Pressable>
      </View>

      {/* Map */}
      <RadarMap
        lat={displayLat}
        lon={displayLon}
        activeLayer={activeLayer}
      />

      {/* Layer picker */}
      <RadarLayerPicker
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      {/* Playback bar */}
      <View style={{ backgroundColor: colors.background }}>
        <RadarPlayback
          currentTimestamp={currentTimestamp}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 11,
  },
});
