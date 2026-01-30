/**
 * Weather charts component for visualizing forecast data
 * Uses react-native-gifted-charts for rendering
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { HourlyForecast, DailyForecast, Units } from '@/types';

type ChartType = 'temperature' | 'precipitation' | 'humidity' | 'wind';

interface WeatherChartsProps {
  hourlyData?: HourlyForecast[];
  dailyData?: DailyForecast[];
  units?: Units;
}

function getTemperatureUnit(units: Units): string {
  switch (units) {
    case 'imperial':
      return '\u00B0F';
    case 'metric':
      return '\u00B0C';
    default:
      return 'K';
  }
}

function getSpeedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'm/s';
}

/** Compute props for y-axis negative value support */
function getNegativeAxisProps(datasets: { value: number }[][]) {
  const allValues = datasets.flat().map((d) => d.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  if (minVal >= 0) return {};

  const absMin = Math.abs(minVal);
  const range = maxVal - minVal;
  const stepValue = Math.ceil(range / 5);
  const noOfSectionsBelowXAxis = Math.ceil(absMin / stepValue);
  const mostNegativeValue = noOfSectionsBelowXAxis * stepValue;

  return {
    mostNegativeValue,
    noOfSectionsBelowXAxis,
  };
}

function formatHour(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  }).replace(' ', '');
}

function formatDay(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

export function WeatherCharts({ hourlyData, dailyData, units = 'imperial' }: WeatherChartsProps) {
  const { colors, isDark } = useTheme();
  const [activeChart, setActiveChart] = useState<ChartType>('temperature');

  const handleChartChange = async (chart: ChartType) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setActiveChart(chart);
  };

  const hourlySlice = hourlyData?.slice(0, 24) || [];
  const dailySlice = dailyData?.slice(0, 7) || [];

  if (hourlySlice.length === 0 && dailySlice.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No data available for charts
        </Text>
      </View>
    );
  }

  // Build data for gifted-charts (LineChart uses {value, label} items)
  const hourlyTempData = hourlySlice.map((h, i) => ({
    value: Math.round(h.temperature),
    label: i % 4 === 0 ? formatHour(h.timestamp) : '',
    dataPointText: i % 4 === 0 ? `${Math.round(h.temperature)}` : undefined,
  }));

  const hourlyFeelsLikeData = hourlySlice.map((h, i) => ({
    value: Math.round(h.feels_like),
    label: i % 4 === 0 ? formatHour(h.timestamp) : '',
  }));

  const hourlyPrecipData = hourlySlice.map((h, i) => ({
    value: Math.round(h.precipitation_probability * 100),
    label: i % 4 === 0 ? formatHour(h.timestamp) : '',
    frontColor: 'rgba(33, 150, 243, 0.7)',
  }));

  const hourlyHumidityData = hourlySlice.map((h, i) => ({
    value: h.humidity,
    label: i % 4 === 0 ? formatHour(h.timestamp) : '',
  }));

  const hourlyWindData = hourlySlice.map((h, i) => ({
    value: Math.round(h.wind_speed),
    label: i % 4 === 0 ? formatHour(h.timestamp) : '',
  }));

  // Daily data
  const dailyHighData = dailySlice.map((d) => ({
    value: Math.round(d.temp_max),
    label: formatDay(d.timestamp),
  }));

  const dailyLowData = dailySlice.map((d) => ({
    value: Math.round(d.temp_min),
    label: formatDay(d.timestamp),
  }));

  const dailyPrecipData = dailySlice.map((d) => ({
    value: Math.round(d.precipitation_probability * 100),
    label: formatDay(d.timestamp),
    frontColor: 'rgba(33, 150, 243, 0.7)',
  }));

  const dailyHumidityData = dailySlice.map((d) => ({
    value: d.humidity,
    label: formatDay(d.timestamp),
  }));

  const dailyWindData = dailySlice.map((d) => ({
    value: Math.round(d.wind_speed),
    label: formatDay(d.timestamp),
  }));

  const chartButtons: { type: ChartType; label: string }[] = [
    { type: 'temperature', label: 'Temp' },
    { type: 'precipitation', label: 'Precip' },
    { type: 'humidity', label: 'Humidity' },
    { type: 'wind', label: 'Wind' },
  ];

  const lineChartCommon = {
    thickness: 2,
    hideRules: true,
    yAxisTextStyle: { color: colors.textSecondary, fontSize: 10 },
    xAxisLabelTextStyle: { color: colors.textSecondary, fontSize: 9 },
    hideDataPoints: false,
    dataPointsRadius: 3,
    spacing: 18,
    initialSpacing: 10,
    endSpacing: 10,
    adjustToWidth: false,
    yAxisColor: 'transparent',
    xAxisColor: colors.border,
    isAnimated: true,
    animationDuration: 500,
    curved: true,
  };

  return (
    <View style={styles.container}>
      {/* Chart Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabContainer}
      >
        {chartButtons.map(({ type, label }) => (
          <Pressable
            key={type}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeChart === type
                  ? (isDark ? colors.primaryLight : '#E3F2FD')
                  : (isDark ? colors.surface : colors.background),
                borderColor: activeChart === type ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleChartChange(type)}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeChart === type ? colors.primary : colors.textSecondary,
                },
                activeChart === type && styles.tabButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Charts */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        {activeChart === 'temperature' && (
          <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              24-Hour Temperature
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={hourlyTempData}
                data2={hourlyFeelsLikeData}
                {...lineChartCommon}
                {...getNegativeAxisProps([hourlyTempData, hourlyFeelsLikeData])}
                color={colors.primary}
                color2="#FF9800"
                dataPointsColor={colors.primary}
                dataPointsColor2="#FF9800"
                height={180}
              />
            </ScrollView>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Temperature ({getTemperatureUnit(units)})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Feels Like
                </Text>
              </View>
            </View>

            <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
              7-Day Temperature Range
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={dailyHighData}
                data2={dailyLowData}
                {...lineChartCommon}
                {...getNegativeAxisProps([dailyHighData, dailyLowData])}
                spacing={40}
                color="#F44336"
                color2="#2196F3"
                dataPointsColor="#F44336"
                dataPointsColor2="#2196F3"
                height={180}
              />
            </ScrollView>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  High ({getTemperatureUnit(units)})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Low ({getTemperatureUnit(units)})
                </Text>
              </View>
            </View>
          </>
        )}

        {activeChart === 'precipitation' && (
          <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              24-Hour Precipitation Chance
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={hourlyPrecipData}
                barWidth={12}
                spacing={10}
                initialSpacing={10}
                height={180}
                maxValue={100}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                yAxisColor="transparent"
                xAxisColor={colors.border}
                hideRules
                isAnimated
                yAxisLabelSuffix="%"
              />
            </ScrollView>

            <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
              7-Day Precipitation Chance
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={dailyPrecipData}
                barWidth={30}
                spacing={20}
                initialSpacing={10}
                height={180}
                maxValue={100}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                yAxisColor="transparent"
                xAxisColor={colors.border}
                hideRules
                isAnimated
                yAxisLabelSuffix="%"
              />
            </ScrollView>
          </>
        )}

        {activeChart === 'humidity' && (
          <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              24-Hour Humidity
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={hourlyHumidityData}
                {...lineChartCommon}
                color="#4CAF50"
                dataPointsColor="#4CAF50"
                height={180}
                maxValue={100}
                yAxisLabelSuffix="%"
              />
            </ScrollView>

            <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
              7-Day Humidity
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={dailyHumidityData}
                {...lineChartCommon}
                spacing={40}
                color="#4CAF50"
                dataPointsColor="#4CAF50"
                height={180}
                maxValue={100}
                yAxisLabelSuffix="%"
              />
            </ScrollView>
          </>
        )}

        {activeChart === 'wind' && (
          <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              24-Hour Wind Speed
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={hourlyWindData}
                {...lineChartCommon}
                color="#9C27B0"
                dataPointsColor="#9C27B0"
                height={180}
              />
            </ScrollView>

            <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
              7-Day Wind Speed
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={dailyWindData}
                {...lineChartCommon}
                spacing={40}
                color="#9C27B0"
                dataPointsColor="#9C27B0"
                height={180}
              />
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tabScrollView: {
    marginBottom: 12,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
  },
  tabButtonTextActive: {
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
