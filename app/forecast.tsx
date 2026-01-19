/**
 * Forecast screen - Daily and hourly forecast display
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { DailyForecastCard, HourlyForecastCard, Loading, ErrorDisplay } from '@/components';

type ForecastView = 'daily' | 'hourly';

export default function ForecastScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { colors, isDark } = useTheme();
  const [activeView, setActiveView] = useState<ForecastView>('daily');

  const dailyQuery = useQuery({
    queryKey: ['forecast', 'daily', defaultCity, units],
    queryFn: () => api.getDailyForecast(defaultCity, units),
    enabled: !!defaultCity,
    staleTime: 10 * 60 * 1000,
  });

  const hourlyQuery = useQuery({
    queryKey: ['forecast', 'hourly', defaultCity, units],
    queryFn: () => api.getHourlyForecast(defaultCity, units),
    enabled: !!defaultCity && activeView === 'hourly',
    staleTime: 10 * 60 * 1000,
  });

  const handleViewChange = async (view: ForecastView) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setActiveView(view);
  };

  const isLoading = activeView === 'daily' ? dailyQuery.isLoading : hourlyQuery.isLoading;
  const error = activeView === 'daily' ? dailyQuery.error : hourlyQuery.error;
  const isRefetching = activeView === 'daily' ? dailyQuery.isRefetching : hourlyQuery.isRefetching;
  const refetch = activeView === 'daily' ? dailyQuery.refetch : hourlyQuery.refetch;

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.header, { color: colors.text }]}>
          {activeView === 'daily' ? '7-Day Forecast' : '48-Hour Forecast'}
        </Text>
        <Text style={[styles.city, { color: colors.textSecondary }]}>{defaultCity}</Text>

        {activeView === 'daily' && dailyQuery.data?.daily?.map((day, index) => (
          <DailyForecastCard key={index} forecast={day} units={units} />
        ))}

        {activeView === 'hourly' && hourlyQuery.data?.hourly?.map((hour, index) => (
          <HourlyForecastCard key={index} forecast={hour} units={units} />
        ))}

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Pull down to refresh
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 32 },
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
