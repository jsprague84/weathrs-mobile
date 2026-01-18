/**
 * Forecast screen - 7-day forecast display
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { DailyForecastCard, Loading, ErrorDisplay } from '@/components';

export default function ForecastScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { colors } = useTheme();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['forecast', 'daily', defaultCity, units],
    queryFn: () => api.getDailyForecast(defaultCity, units),
    enabled: !!defaultCity,
    staleTime: 10 * 60 * 1000,
  });

  if (!defaultCity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Configure your default city in Settings to view the forecast.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Loading forecast..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load forecast"
        message={error instanceof Error ? error.message : 'Check your API server'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.header, { color: colors.text }]}>7-Day Forecast</Text>
      <Text style={[styles.city, { color: colors.textSecondary }]}>{defaultCity}</Text>

      {data?.daily?.map((day, index) => (
        <DailyForecastCard key={index} forecast={day} units={units} />
      ))}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Pull down to refresh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  header: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 4 },
  city: { fontSize: 14, marginHorizontal: 16, marginBottom: 16 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
