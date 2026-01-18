/**
 * Weather card component for displaying current weather
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { CurrentWeather, Units } from '@/types';

interface WeatherCardProps {
  weather: CurrentWeather;
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

function getSpeedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'm/s';
}

export function WeatherCard({ weather, units = 'imperial' }: WeatherCardProps) {
  const { colors, isDark } = useTheme();
  const tempUnit = getTemperatureUnit(units);
  const speedUnit = getSpeedUnit(units);

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      shadowOpacity: isDark ? 0.3 : 0.1,
    }]}>
      <View style={styles.header}>
        <Text style={[styles.city, { color: colors.text }]}>{weather.city}</Text>
        <Text style={[styles.country, { color: colors.textSecondary }]}>{weather.country}</Text>
      </View>

      <View style={styles.mainTemp}>
        <Text style={[styles.temperature, { color: colors.primary }]}>
          {Math.round(weather.temperature)}{tempUnit}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {weather.description}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Feels Like</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {Math.round(weather.feels_like)}{tempUnit}
          </Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Humidity</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{weather.humidity}%</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Wind</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {Math.round(weather.wind_speed)} {speedUnit}
          </Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Pressure</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{weather.pressure} hPa</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  city: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  country: {
    fontSize: 16,
  },
  mainTemp: {
    alignItems: 'center',
    marginBottom: 24,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '200',
  },
  description: {
    fontSize: 18,
    textTransform: 'capitalize',
    marginTop: 8,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
