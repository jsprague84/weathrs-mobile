/**
 * Forecast screen - 7-day forecast display
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import api from '@/services/api';
import { DailyForecastCard } from '@/components';

export default function ForecastScreen() {
  const { defaultCity, units } = useSettingsStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['forecast', 'daily', defaultCity, units],
    queryFn: () => api.getDailyForecast(defaultCity, units),
    enabled: !!defaultCity,
    staleTime: 10 * 60 * 1000,
  });

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
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
            {error instanceof Error ? error.message : 'Check your API server'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <Text style={styles.header}>7-Day Forecast</Text>
      <Text style={styles.city}>{defaultCity}</Text>

      {data?.daily?.map((day, index) => (
        <DailyForecastCard key={index} forecast={day} units={units} />
      ))}

      <Text style={styles.hint}>Pull down to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingVertical: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  loading: { fontSize: 16, color: '#666', marginTop: 16 },
  error: { fontSize: 18, fontWeight: '600', color: '#f44336', marginBottom: 8 },
  errorDetail: { fontSize: 14, color: '#666', textAlign: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginBottom: 4 },
  city: { fontSize: 14, color: '#666', marginHorizontal: 16, marginBottom: 16 },
  hint: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 24 },
});
