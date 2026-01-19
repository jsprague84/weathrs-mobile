/**
 * Expandable daily forecast card component
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, LayoutAnimation, UIManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { DailyForecast, Units } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function getSpeedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'm/s';
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

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function getMoonPhaseEmoji(phase: number): string {
  if (phase === 0 || phase === 1) return '🌑'; // New moon
  if (phase < 0.25) return '🌒'; // Waxing crescent
  if (phase === 0.25) return '🌓'; // First quarter
  if (phase < 0.5) return '🌔'; // Waxing gibbous
  if (phase === 0.5) return '🌕'; // Full moon
  if (phase < 0.75) return '🌖'; // Waning gibbous
  if (phase === 0.75) return '🌗'; // Last quarter
  return '🌘'; // Waning crescent
}

function getMoonPhaseName(phase: number): string {
  if (phase === 0 || phase === 1) return 'New Moon';
  if (phase < 0.25) return 'Waxing Crescent';
  if (phase === 0.25) return 'First Quarter';
  if (phase < 0.5) return 'Waxing Gibbous';
  if (phase === 0.5) return 'Full Moon';
  if (phase < 0.75) return 'Waning Gibbous';
  if (phase === 0.75) return 'Last Quarter';
  return 'Waning Crescent';
}

export function DailyForecastCard({ forecast, units = 'imperial' }: DailyForecastCardProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const tempUnit = getTemperatureUnit(units);
  const speedUnit = getSpeedUnit(units);
  const precipChance = Math.round(forecast.precipitation_probability * 100);
  const hasPrecip = forecast.rain_volume || forecast.snow_volume;

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, {
        backgroundColor: colors.card,
        shadowOpacity: isDark ? 0.2 : 0.05,
      }]}
    >
      {/* Collapsed View - Main Row */}
      <View style={styles.mainRow}>
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

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
          {forecast.description}
        </Text>

        <View style={styles.precipContainer}>
          {precipChance > 0 ? (
            <Text style={[styles.precip, { color: colors.primary }]}>
              {precipChance}%
            </Text>
          ) : (
            <Text style={[styles.precip, { color: colors.textMuted }]}>—</Text>
          )}
        </View>

        <Text style={[styles.expandIcon, { color: colors.textMuted }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>

      {/* Expanded View - Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Summary */}
          {forecast.summary && (
            <Text style={[styles.summary, { color: colors.textSecondary }]}>
              {forecast.summary}
            </Text>
          )}

          {/* Temperature Details */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temperature</Text>
            <View style={styles.detailGrid}>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Morning</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.round(forecast.temp_morning)}{tempUnit}
                </Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Day</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.round(forecast.temp_day)}{tempUnit}
                </Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Evening</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.round(forecast.temp_evening)}{tempUnit}
                </Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Night</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.round(forecast.temp_night)}{tempUnit}
                </Text>
              </View>
            </View>
          </View>

          {/* Conditions */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Conditions</Text>
            <View style={styles.detailGrid}>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Wind</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.round(forecast.wind_speed)} {speedUnit}
                </Text>
                <Text style={[styles.detailSubtext, { color: colors.textMuted }]}>
                  {getWindDirection(forecast.wind_direction)}
                </Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Humidity</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{forecast.humidity}%</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>UV Index</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {forecast.uv_index.toFixed(1)}
                </Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Clouds</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{forecast.clouds}%</Text>
              </View>
            </View>
          </View>

          {/* Precipitation */}
          {hasPrecip && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Precipitation</Text>
              <View style={styles.detailRow}>
                {forecast.rain_volume && (
                  <Text style={[styles.precipDetail, { color: colors.primary }]}>
                    Rain: {forecast.rain_volume.toFixed(2)}″
                  </Text>
                )}
                {forecast.snow_volume && (
                  <Text style={[styles.precipDetail, { color: colors.primary }]}>
                    Snow: {forecast.snow_volume.toFixed(2)}″
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Sun & Moon */}
          <View style={styles.sunMoonRow}>
            <View style={[styles.sunMoonItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Text style={[styles.sunMoonLabel, { color: colors.textMuted }]}>Sunrise</Text>
              <Text style={[styles.sunMoonValue, { color: colors.text }]}>
                {formatTime(forecast.sunrise)}
              </Text>
            </View>
            <View style={[styles.sunMoonItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Text style={[styles.sunMoonLabel, { color: colors.textMuted }]}>Sunset</Text>
              <Text style={[styles.sunMoonValue, { color: colors.text }]}>
                {formatTime(forecast.sunset)}
              </Text>
            </View>
            <View style={[styles.sunMoonItem, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Text style={[styles.sunMoonLabel, { color: colors.textMuted }]}>Moon</Text>
              <Text style={styles.moonEmoji}>{getMoonPhaseEmoji(forecast.moon_phase)}</Text>
              <Text style={[styles.moonPhase, { color: colors.textMuted }]}>
                {getMoonPhaseName(forecast.moon_phase)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
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
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    width: 75,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 80,
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
  },
  precipContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  precip: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 10,
    marginLeft: 8,
    width: 12,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    width: '48%',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailSubtext: {
    fontSize: 10,
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  precipDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
  sunMoonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sunMoonItem: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  sunMoonLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  sunMoonValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  moonEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  moonPhase: {
    fontSize: 9,
    textAlign: 'center',
  },
});
