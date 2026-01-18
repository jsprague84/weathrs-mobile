/**
 * Weather card component for displaying current weather
 */

import { View, Text, StyleSheet } from 'react-native';
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
  const tempUnit = getTemperatureUnit(units);
  const speedUnit = getSpeedUnit(units);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.city}>{weather.city}</Text>
        <Text style={styles.country}>{weather.country}</Text>
      </View>

      <View style={styles.mainTemp}>
        <Text style={styles.temperature}>
          {Math.round(weather.temperature)}{tempUnit}
        </Text>
        <Text style={styles.description}>{weather.description}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Feels Like</Text>
          <Text style={styles.detailValue}>
            {Math.round(weather.feels_like)}{tempUnit}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{weather.humidity}%</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>
            {Math.round(weather.wind_speed)} {speedUnit}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pressure</Text>
          <Text style={styles.detailValue}>{weather.pressure} hPa</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#333',
  },
  country: {
    fontSize: 16,
    color: '#666',
  },
  mainTemp: {
    alignItems: 'center',
    marginBottom: 24,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '200',
    color: '#2196F3',
  },
  description: {
    fontSize: 18,
    color: '#666',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
