/**
 * History screen - Historical weather trends and data
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import { useDailyHistory, useWeatherTrends } from '@/hooks/useWeather';
import { HistoryCharts, CitySelector, Loading, ErrorDisplay } from '@/components';
import type { HistoryPeriod, DailyHistorySummary } from '@/types';

const PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
];

type HistoryChartType = 'temperature' | 'precipitation' | 'humidity' | 'wind';

const CHART_TYPES: { value: HistoryChartType; label: string }[] = [
  { value: 'temperature', label: 'Temp' },
  { value: 'precipitation', label: 'Precip' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'wind', label: 'Wind' },
];

function getTemperatureUnit(units: string): string {
  switch (units) {
    case 'imperial':
      return '\u00B0F';
    case 'metric':
      return '\u00B0C';
    default:
      return 'K';
  }
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'rising':
      return 'trending-up';
    case 'falling':
      return 'trending-down';
    default:
      return 'remove-outline';
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'rising':
      return '#F44336';
    case 'falling':
      return '#2196F3';
    default:
      return '#9E9E9E';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { getSelectedCity, cities } = useCitiesStore();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<HistoryPeriod>('7d');
  const [chartType, setChartType] = useState<HistoryChartType>('temperature');

  // Custom date range state
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const [customStart, setCustomStart] = useState<Date>(thirtyDaysAgo);
  const [customEnd, setCustomEnd] = useState<Date>(yesterday);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Convert to midnight-aligned UTC timestamps (seconds)
  const customStartTs = period === 'custom'
    ? Math.floor(new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).getTime() / 1000)
    : undefined;
  const customEndTs = period === 'custom'
    ? Math.floor(new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate()).getTime() / 1000) + 86400
    : undefined;

  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;

  const trendsQuery = useWeatherTrends(cityToQuery || undefined, period, customStartTs, customEndTs);
  const dailyQuery = useDailyHistory(cityToQuery || undefined, period, customStartTs, customEndTs);

  const handlePeriodChange = async (newPeriod: HistoryPeriod) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setPeriod(newPeriod);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleStartDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (date) setCustomStart(date);
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (date) setCustomEnd(date);
  };

  // Validation for custom range
  const customRangeValid = customStart < customEnd
    && (customEnd.getTime() - customStart.getTime()) / 86400000 <= 365
    && customEnd <= yesterday;

  const handleChartTypeChange = async (type: HistoryChartType) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setChartType(type);
  };

  const handleAddCity = () => {
    router.push('/settings');
  };

  const isLoading = trendsQuery.isLoading || dailyQuery.isLoading;
  const error = trendsQuery.error || dailyQuery.error;
  const isRefetching = trendsQuery.isRefetching || dailyQuery.isRefetching;
  const refetch = () => {
    trendsQuery.refetch();
    dailyQuery.refetch();
  };

  if (!cityToQuery) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Add cities in Settings to view weather history.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Loading history data..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load history"
        message={error instanceof Error ? error.message : 'Check your API server'}
        onRetry={refetch}
      />
    );
  }

  const summary = trendsQuery.data?.summary;
  const days: DailyHistorySummary[] = dailyQuery.data?.days ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* City Selector */}
      {cities.length > 0 && (
        <CitySelector onAddCity={handleAddCity} />
      )}

      <Text style={[styles.header, { color: colors.text }]}>Weather History</Text>
      <Text style={[styles.city, { color: colors.textSecondary }]}>
        {selectedCity?.displayName || cityToQuery}
      </Text>

      {/* Period Picker */}
      <View style={[styles.segmentedControl, { backgroundColor: isDark ? colors.surface : '#E0E0E0' }]}>
        {PERIODS.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[
              styles.segment,
              period === value && { backgroundColor: colors.card },
            ]}
            onPress={() => handlePeriodChange(value)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: period === value ? colors.primary : colors.textSecondary },
                period === value && styles.segmentTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Custom Date Range Pickers */}
      {period === 'custom' && (
        <View style={[styles.datePickerSection, { backgroundColor: colors.card }]}>
          <Pressable
            style={styles.dateRow}
            onPress={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
          >
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {customStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={customEnd}
              onChange={handleStartDateChange}
            />
          )}

          <View style={[styles.dateSeparator, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.dateRow}
            onPress={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
          >
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>End</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {customEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={customStart}
              maximumDate={yesterday}
              onChange={handleEndDateChange}
            />
          )}

          {!customRangeValid && (
            <Text style={styles.dateError}>
              Invalid range. Max 365 days, end must be before today.
            </Text>
          )}
        </View>
      )}

      {/* Trend Summary Card */}
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Trend Summary</Text>

          <View style={styles.summaryGrid}>
            {/* Temperature Trend */}
            <View style={styles.summaryItem}>
              <Ionicons
                name={getTrendIcon(summary.temp_trend) as any}
                size={24}
                color={getTrendColor(summary.temp_trend)}
              />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(summary.avg_temp)}{getTemperatureUnit(units)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Avg Temp ({summary.temp_trend})
              </Text>
            </View>

            {/* High */}
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up" size={24} color="#F44336" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(summary.max_temp.value)}{getTemperatureUnit(units)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                High ({formatDate(summary.max_temp.date)})
              </Text>
            </View>

            {/* Low */}
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down" size={24} color="#2196F3" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(summary.min_temp.value)}{getTemperatureUnit(units)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Low ({formatDate(summary.min_temp.date)})
              </Text>
            </View>

            {/* Precipitation */}
            <View style={styles.summaryItem}>
              <Ionicons name="rainy" size={24} color="#2196F3" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(summary.total_precipitation * 10) / 10}mm
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Total Precip
              </Text>
            </View>

            {/* Humidity */}
            <View style={styles.summaryItem}>
              <Ionicons name="water" size={24} color="#4CAF50" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(summary.avg_humidity)}%
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Avg Humidity
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartTabScrollView}
        contentContainerStyle={styles.chartTabContainer}
      >
        {CHART_TYPES.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[
              styles.chartTab,
              {
                backgroundColor: chartType === value
                  ? (isDark ? colors.primaryLight : '#E3F2FD')
                  : (isDark ? colors.surface : colors.background),
                borderColor: chartType === value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleChartTypeChange(value)}
          >
            <Text
              style={[
                styles.chartTabText,
                {
                  color: chartType === value ? colors.primary : colors.textSecondary,
                },
                chartType === value && styles.chartTabTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* History Chart */}
      {days.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <HistoryCharts
            data={days}
            chartType={chartType}
            units={units}
          />
        </View>
      )}

      {/* Daily Breakdown */}
      {days.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Daily Breakdown</Text>
          {days.map((day) => (
            <View key={day.date} style={[styles.dayCard, { backgroundColor: colors.card }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, { color: colors.text }]}>
                  {formatDate(day.date)}
                </Text>
                {day.dominant_condition && (
                  <Text style={[styles.dayCondition, { color: colors.textSecondary }]}>
                    {day.dominant_condition}
                  </Text>
                )}
              </View>
              <View style={styles.dayStats}>
                <View style={styles.dayStat}>
                  <Ionicons name="thermometer" size={14} color="#F44336" />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {Math.round(day.temp_max)}/{Math.round(day.temp_min)}{getTemperatureUnit(units)}
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Ionicons name="water" size={14} color="#4CAF50" />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {Math.round(day.humidity_avg)}%
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Ionicons name="rainy" size={14} color="#2196F3" />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {Math.round(day.precipitation_total * 10) / 10}mm
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Ionicons name="speedometer" size={14} color="#9C27B0" />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {Math.round(day.wind_speed_avg)} {units === 'imperial' ? 'mph' : 'm/s'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
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
  summaryCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 90,
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  chartTabScrollView: {
    marginBottom: 12,
  },
  chartTabContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chartTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chartTabText: {
    fontSize: 14,
  },
  chartTabTextActive: {
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownSection: {
    marginHorizontal: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dayCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayCondition: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  dayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayStatText: {
    fontSize: 13,
  },
  datePickerSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  dateError: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
