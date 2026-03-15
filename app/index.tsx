/**
 * Home screen - Current weather display with extended details
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { WeatherCard, AlertBanner, CitySelector, AirQualityCard, Loading, ErrorDisplay, Skeleton, StaleDataBanner, CurrentDateTime } from '@/components';
import { useCityToQuery } from '@/hooks/useCityToQuery';
import { useAirQuality } from '@/hooks/useWeather';

export default function HomeScreen() {
  const { units, apiUrl } = useSettingsStore();
  const { cities } = useCitiesStore();
  const { colors } = useTheme();
  const router = useRouter();

  const cityToQuery = useCityToQuery();

  const { data: airQuality } = useAirQuality(cityToQuery || undefined);

  const { data: forecast, isLoading, error, refetch, isRefetching, dataUpdatedAt } = useQuery({
    queryKey: ['forecast', 'full', cityToQuery, units],
    queryFn: () => api.getFullForecast(cityToQuery, units),
    enabled: !!cityToQuery,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddCity = () => {
    router.push('/settings');
  };

  if (!cityToQuery) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Welcome to Weathrs</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Go to Settings to add cities and configure your API server.
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Current API: {apiUrl}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: 24 }}>
          <Skeleton.Card />
        </View>
      </View>
    );
  }

  if (error && !forecast) {
    return (
      <ErrorDisplay
        title="Failed to load weather"
        message={error instanceof Error ? error.message : 'Check your API server'}
        onRetry={() => refetch()}
      />
    );
  }

  const isStale = !!error && !!forecast;

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
      {/* City Selector - only show if there are saved cities */}
      {cities.length > 0 && (
        <CitySelector onAddCity={handleAddCity} />
      )}

      <CurrentDateTime />

      {/* Stale data banner when showing cached data while offline */}
      {isStale && dataUpdatedAt > 0 && (
        <StaleDataBanner dataUpdatedAt={dataUpdatedAt} />
      )}

      {/* Weather Alerts */}
      {forecast?.alerts && forecast.alerts.length > 0 && (
        <AlertBanner alerts={forecast.alerts} />
      )}

      {forecast && (
        <WeatherCard
          weather={forecast.current}
          location={forecast.location}
          units={units}
        />
      )}

      {airQuality && (
        <AirQualityCard data={airQuality} />
      )}

      <Text style={[styles.pullHint, { color: colors.textMuted }]}>
        Pull down to refresh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hint: { fontSize: 12, marginTop: 24 },
  pullHint: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
