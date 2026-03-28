import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export type RadarLayer = 'precipitation_new' | 'clouds_new' | 'temp_new' | 'wind_new';

interface LegendConfig {
  label: string;
  colors: string[];
  startLabel: string;
  endLabel: string;
}

const LEGEND_CONFIG: Record<RadarLayer, LegendConfig> = {
  precipitation_new: {
    label: 'Precipitation',
    colors: ['#00c853', '#76ff03', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0'],
    startLabel: 'Light',
    endLabel: 'Heavy',
  },
  clouds_new: {
    label: 'Cloud Cover',
    colors: ['#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242'],
    startLabel: 'Thin',
    endLabel: 'Dense',
  },
  temp_new: {
    label: 'Temperature',
    colors: ['#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0'],
    startLabel: 'Cold',
    endLabel: 'Hot',
  },
  wind_new: {
    label: 'Wind Speed',
    colors: ['#ffffff', '#aed8e6', '#63b8f2', '#4882c8', '#a060fa', '#dc42ef'],
    startLabel: 'Calm',
    endLabel: 'Strong',
  },
};

interface RadarLegendProps {
  layer: RadarLayer;
}

export function RadarLegend({ layer }: RadarLegendProps) {
  const { colors } = useTheme();
  const config = LEGEND_CONFIG[layer];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{config.label}</Text>
      <View style={styles.row}>
        <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{config.startLabel}</Text>
        {config.colors.map((color, i) => (
          <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
        <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{config.endLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  label: {
    fontSize: 9,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  rangeLabel: {
    fontSize: 8,
    marginHorizontal: 4,
  },
  swatch: {
    width: 14,
    height: 6,
    borderRadius: 1,
  },
});
