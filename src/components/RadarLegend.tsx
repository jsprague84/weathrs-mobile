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
    colors: ['#7878BE', '#6E6ECD', '#5050E1', '#3232F0', '#1414FF'],
    startLabel: 'Light',
    endLabel: 'Heavy',
  },
  clouds_new: {
    label: 'Cloud Cover',
    colors: ['#FDFDFF', '#F7F7FF', '#F4F4FF', '#E9E9DF', '#DEDEDE', '#D2D2D2'],
    startLabel: 'Thin',
    endLabel: 'Dense',
  },
  temp_new: {
    label: 'Temperature',
    colors: ['#821692', '#8257DB', '#208CEC', '#23DDDD', '#C2FF28', '#FFF028', '#FC8014'],
    startLabel: 'Cold',
    endLabel: 'Hot',
  },
  wind_new: {
    label: 'Wind Speed',
    colors: ['#EECECC', '#C9A4C3', '#B364BC', '#6D2E8A', '#3F213B', '#0D1126'],
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
