/**
 * Weather card component for displaying current weather with extended details
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { FullCurrentWeather, Units } from '@/types';

interface WeatherCardProps {
  weather: FullCurrentWeather;
  location: { city: string; country: string };
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

function getVisibilityUnit(units: Units): string {
  return units === 'imperial' ? 'mi' : 'km';
}

function formatVisibility(meters: number, units: Units): string {
  if (units === 'imperial') {
    const miles = meters / 1609.34;
    return miles >= 10 ? '10+' : miles.toFixed(1);
  }
  const km = meters / 1000;
  return km >= 10 ? '10+' : km.toFixed(1);
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getUVDescription(uvi: number): string {
  if (uvi <= 2) return 'Low';
  if (uvi <= 5) return 'Moderate';
  if (uvi <= 7) return 'High';
  if (uvi <= 10) return 'Very High';
  return 'Extreme';
}

function getUVColor(uvi: number, colors: { success: string; warning: string; error: string }): string {
  if (uvi <= 2) return colors.success;
  if (uvi <= 5) return '#FFC107'; // yellow
  if (uvi <= 7) return colors.warning;
  return colors.error;
}

export function WeatherCard({ weather, location, units = 'imperial' }: WeatherCardProps) {
  const { colors, isDark } = useTheme();
  const tempUnit = getTemperatureUnit(units);
  const speedUnit = getSpeedUnit(units);
  const visUnit = getVisibilityUnit(units);

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      shadowOpacity: isDark ? 0.3 : 0.1,
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.city, { color: colors.text }]}>{location.city}</Text>
        <Text style={[styles.country, { color: colors.textSecondary }]}>{location.country}</Text>
      </View>

      {/* Main Temperature */}
      <View style={styles.mainTemp}>
        <Text style={[styles.temperature, { color: colors.primary }]}>
          {Math.round(weather.temperature)}{tempUnit}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {weather.description}
        </Text>
      </View>

      {/* Primary Details Row */}
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
          <Text style={[styles.detailSubtext, { color: colors.textMuted }]}>
            {getWindDirection(weather.wind_direction)}
          </Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Pressure</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{weather.pressure}</Text>
          <Text style={[styles.detailSubtext, { color: colors.textMuted }]}>hPa</Text>
        </View>
      </View>

      {/* Extended Details Row */}
      <View style={styles.details}>
        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>UV Index</Text>
          <Text style={[styles.detailValue, { color: getUVColor(weather.uv_index, colors) }]}>
            {weather.uv_index.toFixed(1)}
          </Text>
          <Text style={[styles.detailSubtext, { color: colors.textMuted }]}>
            {getUVDescription(weather.uv_index)}
          </Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Visibility</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatVisibility(weather.visibility, units)}
          </Text>
          <Text style={[styles.detailSubtext, { color: colors.textMuted }]}>{visUnit}</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Clouds</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{weather.clouds}%</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Updated</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatTime(weather.timestamp)}
          </Text>
        </View>
      </View>

      {/* Sunrise/Sunset Row */}
      <View style={[styles.sunRow, { backgroundColor: isDark ? colors.surface : colors.background }]}>
        <View style={styles.sunItem}>
          <Text style={[styles.sunLabel, { color: colors.textMuted }]}>Sunrise</Text>
          <Text style={[styles.sunValue, { color: colors.text }]}>
            {formatTime(weather.sunrise)}
          </Text>
        </View>
        <View style={[styles.sunDivider, { backgroundColor: colors.border }]} />
        <View style={styles.sunItem}>
          <Text style={[styles.sunLabel, { color: colors.textMuted }]}>Sunset</Text>
          <Text style={[styles.sunValue, { color: colors.text }]}>
            {formatTime(weather.sunset)}
          </Text>
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
    marginBottom: 20,
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
    marginBottom: 8,
  },
  detailItem: {
    width: '48%',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSubtext: {
    fontSize: 10,
    marginTop: 1,
  },
  sunRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  sunItem: {
    flex: 1,
    alignItems: 'center',
  },
  sunDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  sunLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  sunValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
