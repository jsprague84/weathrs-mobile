/**
 * Air quality card component displaying AQI and pollutant levels
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { AirQualityResponse } from '@/types';

interface AirQualityCardProps {
  data: AirQualityResponse;
}

function getAqiColor(aqi: number, colors: { success: string; warning: string; error: string }): string {
  switch (aqi) {
    case 1: return colors.success;
    case 2: return '#8BC34A'; // light green
    case 3: return colors.warning;
    case 4: return '#FF9800'; // orange
    case 5: return colors.error;
    default: return colors.warning;
  }
}

const POLLUTANT_LABELS: Record<string, string> = {
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  o3: 'O₃',
  no2: 'NO₂',
  so2: 'SO₂',
  co: 'CO',
  no: 'NO',
  nh3: 'NH₃',
};

// Show the most relevant pollutants
const DISPLAY_POLLUTANTS = ['pm2_5', 'pm10', 'o3', 'no2'] as const;

export function AirQualityCard({ data }: AirQualityCardProps) {
  const { colors, isDark } = useTheme();
  const aqiColor = getAqiColor(data.aqi, colors);

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      shadowOpacity: isDark ? 0.3 : 0.1,
    }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Air Quality</Text>
        <View style={[styles.aqiBadge, { backgroundColor: aqiColor }]}>
          <Text style={styles.aqiValue}>{data.aqi}</Text>
        </View>
      </View>

      <Text style={[styles.aqiLabel, { color: aqiColor }]}>
        {data.aqi_label}
      </Text>

      <View style={styles.pollutants}>
        {DISPLAY_POLLUTANTS.map((key) => (
          <View
            key={key}
            style={[styles.pollutantItem, { backgroundColor: isDark ? colors.surface : colors.background }]}
          >
            <Text style={[styles.pollutantLabel, { color: colors.textMuted }]}>
              {POLLUTANT_LABELS[key]}
            </Text>
            <Text style={[styles.pollutantValue, { color: colors.text }]}>
              {data.components[key].toFixed(1)}
            </Text>
            <Text style={[styles.pollutantUnit, { color: colors.textMuted }]}>μg/m³</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  aqiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aqiValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aqiLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  pollutants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pollutantItem: {
    width: '48%',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  pollutantLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  pollutantValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pollutantUnit: {
    fontSize: 10,
    marginTop: 1,
  },
});
