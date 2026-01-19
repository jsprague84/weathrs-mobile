/**
 * Hourly forecast card component
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { HourlyForecast, Units } from '@/types';

interface HourlyForecastCardProps {
  forecast: HourlyForecast;
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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();

  // Check if it's the current hour
  if (
    date.getHours() === now.getHours() &&
    date.toDateString() === now.toDateString()
  ) {
    return 'Now';
  }

  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });

  if (date.toDateString() === tomorrow.toDateString()) {
    return `${timeStr}\nTomorrow`;
  }

  if (date.toDateString() !== now.toDateString()) {
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${timeStr}\n${dayStr}`;
  }

  return timeStr;
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function HourlyForecastCard({ forecast, units = 'imperial' }: HourlyForecastCardProps) {
  const { colors, isDark } = useTheme();
  const tempUnit = getTemperatureUnit(units);
  const speedUnit = getSpeedUnit(units);
  const precipChance = Math.round(forecast.precipitation_probability * 100);
  const hasPrecip = forecast.rain_volume || forecast.snow_volume;

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      shadowOpacity: isDark ? 0.2 : 0.05,
    }]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: colors.text }]}>
          {formatTime(forecast.timestamp)}
        </Text>
      </View>

      <View style={styles.mainInfo}>
        <Text style={[styles.temp, { color: colors.text }]}>
          {Math.round(forecast.temperature)}{tempUnit}
        </Text>
        <Text style={[styles.feelsLike, { color: colors.textMuted }]}>
          Feels {Math.round(forecast.feels_like)}{tempUnit}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
          {forecast.description}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            {Math.round(forecast.wind_speed)} {speedUnit} {getWindDirection(forecast.wind_direction)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            {forecast.humidity}% humidity
          </Text>
        </View>
      </View>

      <View style={styles.precipContainer}>
        {precipChance > 0 ? (
          <Text style={[styles.precip, { color: colors.primary }]}>
            {precipChance}%
          </Text>
        ) : (
          <Text style={[styles.precip, { color: colors.textMuted }]}>
            —
          </Text>
        )}
        {hasPrecip && (
          <Text style={[styles.precipVolume, { color: colors.primary }]}>
            {forecast.snow_volume ? `${forecast.snow_volume}″` : `${forecast.rain_volume}″`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    width: 55,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  mainInfo: {
    width: 70,
    alignItems: 'center',
  },
  temp: {
    fontSize: 18,
    fontWeight: '600',
  },
  feelsLike: {
    fontSize: 10,
  },
  details: {
    flex: 1,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 10,
  },
  precipContainer: {
    width: 45,
    alignItems: 'flex-end',
  },
  precip: {
    fontSize: 14,
    fontWeight: '600',
  },
  precipVolume: {
    fontSize: 10,
  },
});
