import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { RadarLayer } from './RadarLegend';

interface LayerOption {
  id: RadarLayer;
  label: string;
}

const LAYERS: LayerOption[] = [
  { id: 'precipitation_new', label: 'Precip' },
  { id: 'clouds_new', label: 'Clouds' },
  { id: 'temp_new', label: 'Temp' },
  { id: 'wind_new', label: 'Wind' },
];

interface RadarLayerPickerProps {
  activeLayer: RadarLayer;
  onLayerChange: (layer: RadarLayer) => void;
}

export function RadarLayerPicker({ activeLayer, onLayerChange }: RadarLayerPickerProps) {
  const { colors } = useTheme();

  const handlePress = (layer: RadarLayer) => {
    if (layer === activeLayer) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onLayerChange(layer);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {LAYERS.map((layer) => {
        const isActive = layer.id === activeLayer;
        return (
          <Pressable
            key={layer.id}
            onPress={() => handlePress(layer.id)}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${layer.label} layer`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#ffffff' : colors.primary },
              ]}
            >
              {layer.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export type { RadarLayer } from './RadarLegend';
