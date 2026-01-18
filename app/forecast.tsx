/**
 * Forecast screen - 7-day forecast display
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDailyForecast } from '@/hooks';
import { useSettingsStore } from '@/stores/settingsStore';
import { DailyForecastCard } from '@/components';
import { useState } from 'react';

export default function ForecastScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { data, isLoading, error, refetch, isRefetching } = useDailyForecast();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!defaultCity) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>
            Configure your default city in Settings to view the forecast.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loading}>Loading forecast...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.error}>Failed to load forecast</Text>
          <Text style={styles.errorDetail}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>7-Day Forecast</Text>
      <Text style={styles.city}>{defaultCity}</Text>

      {data?.daily.map((day, index) => (
        <DailyForecastCard key={index} forecast={day} units={units} />
      ))}

      <Text style={styles.hint}>Pull down to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
  },
});
