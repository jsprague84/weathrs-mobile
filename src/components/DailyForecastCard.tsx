/**
 * Daily forecast card component with theme support
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { DailyForecast, Units } from '@/types';

interface DailyForecastCardProps {
  forecast: DailyForecast;
  units?: Units;
}

function getTemperatureUnit(units: Units): string {
  switch (units) {
    case 'imperial':
      return '°F';
    case 'metric':
      return '°C';
    default:
      return 'K';
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DailyForecastCard({ forecast, units = 'imperial' }: DailyForecastCardProps) {
  const { colors, isDark } = useTheme();
  const tempUnit = getTemperatureUnit(units);
  const precipChance = Math.round(forecast.precipitation_probability * 100);

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      shadowOpacity: isDark ? 0.2 : 0.05,
    }]}>
      <Text style={[styles.date, { color: colors.text }]}>
        {formatDate(forecast.timestamp)}
      </Text>

      <View style={styles.tempContainer}>
        <Text style={[styles.tempHigh, { color: colors.text }]}>
          {Math.round(forecast.temp_max)}{tempUnit}
        </Text>
        <Text style={[styles.tempLow, { color: colors.textMuted }]}>
          {Math.round(forecast.temp_min)}{tempUnit}
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {forecast.description}
      </Text>

      {precipChance > 0 && (
        <Text style={[styles.precip, { color: colors.primary }]}>
          {precipChance}% precip
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempHigh: {
    fontSize: 16,
    fontWeight: '600',
  },
  tempLow: {
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
  precip: {
    fontSize: 12,
    width: 70,
    textAlign: 'right',
  },
});
