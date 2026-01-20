/**
 * Forecast screen - Daily and hourly forecast display
 */

import { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { DailyForecastCard, HourlyForecastCard, CitySelector, Loading, ErrorDisplay } from '@/components';
import type { DailyForecast, HourlyForecast } from '@/types';

type ForecastView = 'daily' | 'hourly';

export default function ForecastScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { getSelectedCity, cities } = useCitiesStore();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeView, setActiveView] = useState<ForecastView>('daily');

  // Use selected city from cities store, fallback to default city
  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;

  const dailyQuery = useQuery({
    queryKey: ['forecast', 'daily', cityToQuery, units],
    queryFn: () => api.getDailyForecast(cityToQuery, units),
    enabled: !!cityToQuery,
    staleTime: 10 * 60 * 1000,
  });

  const hourlyQuery = useQuery({
    queryKey: ['forecast', 'hourly', cityToQuery, units],
    queryFn: () => api.getHourlyForecast(cityToQuery, units),
    enabled: !!cityToQuery && activeView === 'hourly',
    staleTime: 10 * 60 * 1000,
  });

  const handleViewChange = async (view: ForecastView) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setActiveView(view);
  };

  const handleAddCity = () => {
    router.push('/settings');
  };

  const isLoading = activeView === 'daily' ? dailyQuery.isLoading : hourlyQuery.isLoading;
  const error = activeView === 'daily' ? dailyQuery.error : hourlyQuery.error;
  const isRefetching = activeView === 'daily' ? dailyQuery.isRefetching : hourlyQuery.isRefetching;
  const refetch = activeView === 'daily' ? dailyQuery.refetch : hourlyQuery.refetch;

  if (!cityToQuery) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Add cities in Settings to view the forecast.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <Loading message={`Loading ${activeView} forecast...`} />;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* City Selector - only show if there are saved cities */}
      {cities.length > 0 && (
        <CitySelector onAddCity={handleAddCity} />
      )}

      {/* Segmented Control */}
      <View style={[styles.segmentedControl, { backgroundColor: isDark ? colors.surface : '#E0E0E0' }]}>
        <Pressable
          style={[
            styles.segment,
            activeView === 'daily' && { backgroundColor: colors.card },
          ]}
          onPress={() => handleViewChange('daily')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeView === 'daily' ? colors.primary : colors.textSecondary },
              activeView === 'daily' && styles.segmentTextActive,
            ]}
          >
            7-Day
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segment,
            activeView === 'hourly' && { backgroundColor: colors.card },
          ]}
          onPress={() => handleViewChange('hourly')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeView === 'hourly' ? colors.primary : colors.textSecondary },
              activeView === 'hourly' && styles.segmentTextActive,
            ]}
          >
            Hourly
          </Text>
        </Pressable>
      </View>

      {activeView === 'daily' ? (
        <FlashList
          data={dailyQuery.data?.daily ?? []}
          renderItem={({ item }) => (
            <DailyForecastCard forecast={item} units={units} />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.header, { color: colors.text }]}>7-Day Forecast</Text>
              <Text style={[styles.city, { color: colors.textSecondary }]}>
                {selectedCity?.displayName || cityToQuery}
              </Text>
            </View>
          }
          ListFooterComponent={
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Pull down to refresh
            </Text>
          }
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <FlashList
          data={hourlyQuery.data?.hourly ?? []}
          renderItem={({ item }) => (
            <HourlyForecastCard forecast={item} units={units} />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.header, { color: colors.text }]}>48-Hour Forecast</Text>
              <Text style={[styles.city, { color: colors.textSecondary }]}>
                {selectedCity?.displayName || cityToQuery}
              </Text>
            </View>
          }
          ListFooterComponent={
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Pull down to refresh
            </Text>
          }
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 32 },
  listHeader: { marginBottom: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  header: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 4 },
  city: { fontSize: 14, marginHorizontal: 16, marginBottom: 16 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
