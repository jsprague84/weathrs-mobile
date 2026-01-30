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

/**
 * Compute y-axis scaling props that handle both positive and negative values.
 * gifted-charts requires: maxValue = noOfSections * stepValue
 * and: mostNegativeValue = noOfSectionsBelowXAxis * stepValue
 */
function getYAxisProps(datasets: { value: number }[][], chartHeight: number) {
  const allValues = datasets.flat().map((d) => d.value);
  if (allValues.length === 0) return {};

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  // Add padding so data points aren't clipped at edges
  const padding = Math.max(Math.ceil((maxVal - minVal) * 0.15), 2);
  const paddedMax = maxVal + padding;
  const paddedMin = minVal - padding;

  // Pick a nice step value for ~5 sections across the full range
  const range = paddedMax - Math.min(paddedMin, 0);
  const rawStep = range / 5;
  // Round step to a "nice" number (1, 2, 5, 10, 20, 25, 50, ...)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep = magnitude * (residual <= 1.5 ? 1 : residual <= 3.5 ? 2.5 : residual <= 7.5 ? 5 : 10);
  const stepValue = Math.max(Math.ceil(niceStep), 1);

  const noOfSections = Math.ceil(paddedMax / stepValue);
  const computedMax = noOfSections * stepValue;

  if (paddedMin >= 0) {
    return { maxValue: computedMax, noOfSections, stepValue };
  }

  const noOfSectionsBelowXAxis = Math.ceil(Math.abs(paddedMin) / stepValue);
  const mostNegativeValue = noOfSectionsBelowXAxis * stepValue;

  // Compute pixel height of each section, then shift labels below negative area
  const stepHeight = chartHeight / noOfSections;

  return {
    maxValue: computedMax,
    noOfSections,
    stepValue,
    mostNegativeValue,
    noOfSectionsBelowXAxis,
    // Push x-axis labels below the negative region so they don't overlap the chart
    xAxisLabelsVerticalShift: Math.ceil(noOfSectionsBelowXAxis * stepHeight),
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
    xAxisLabelTextStyle: { color: colors.textSecondary, fontSize: 9, width: 36, textAlign: 'center' as const },
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
                {...getYAxisProps([hourlyTempData, hourlyFeelsLikeData], 180)}
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
                {...getYAxisProps([dailyHighData, dailyLowData], 180)}
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
                noOfSections={5}
                stepValue={20}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9, width: 36, textAlign: 'center' }}
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
                noOfSections={5}
                stepValue={20}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9, width: 40, textAlign: 'center' }}
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
                noOfSections={5}
                stepValue={20}
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
                noOfSections={5}
                stepValue={20}
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
                {...getYAxisProps([hourlyWindData], 180)}
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
                {...getYAxisProps([dailyWindData], 180)}
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
