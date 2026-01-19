/**
 * Charts screen - Weather data visualizations
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { WeatherCharts, CitySelector, Loading, ErrorDisplay } from '@/components';

export default function ChartsScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { getSelectedCity, cities } = useCitiesStore();
  const { colors } = useTheme();
  const router = useRouter();

  // Use selected city from cities store, fallback to default city
  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;

  const { data: forecast, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['forecast', 'full', cityToQuery, units],
    queryFn: () => api.getFullForecast(cityToQuery, units),
    enabled: !!cityToQuery,
    staleTime: 10 * 60 * 1000,
  });

  const handleAddCity = () => {
    router.push('/settings');
  };

  if (!cityToQuery) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Add cities in Settings to view weather charts.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Loading chart data..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load chart data"
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
      {/* City Selector */}
      {cities.length > 0 && (
        <CitySelector onAddCity={handleAddCity} />
      )}

      <Text style={[styles.header, { color: colors.text }]}>Weather Charts</Text>
      <Text style={[styles.city, { color: colors.textSecondary }]}>
        {selectedCity?.displayName || cityToQuery}
      </Text>

      {forecast && (
        <WeatherCharts
          hourlyData={forecast.hourly}
          dailyData={forecast.daily}
          units={units}
        />
      )}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Pull down to refresh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  header: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  city: { fontSize: 14, marginHorizontal: 16, marginBottom: 16 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
